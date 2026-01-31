# Security Improvements & Best Practices

## Current Implementation Status

### ✅ 1. Stripe Signature Verification - IMPLEMENTED
**What it does:** Verifies that webhook requests actually come from Stripe, not attackers.

**Implementation:**
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**Status:** ✅ Fully implemented and required for all webhooks.

---

### ✅ 2. Idempotency - IMPLEMENTED
**What it does:** Prevents duplicate processing if Stripe retries a webhook.

**Why it matters:** 
- Stripe retries failed webhooks automatically
- Without idempotency, you could create duplicate subscriptions
- Or update the same record multiple times

**Implementation:**
- Check if subscription already exists before creating
- Check current status before updating
- Skip processing if already in target state
- Log idempotent skips for monitoring

**Status:** ✅ Added idempotency checks to all webhook handlers:
- `handleCheckoutSessionCompleted` - Checks for existing subscription_id
- `handleSubscriptionUpdated` - Verifies subscription exists before updating
- `handleSubscriptionDeleted` - Skips if already canceled
- `handleInvoicePaymentFailed` - Skips if already marked past_due

---

### ⚠️ 3. Minimized Privileges (RPC/Security Definer) - FOR FUTURE

**Current approach:** Using `service_role` key (bypasses ALL RLS)

**Better approach:** Use PostgreSQL RPC functions with `SECURITY DEFINER`

#### Why This Matters

**Current (Service Role):**
- ✅ Simple to implement
- ✅ Works for all operations
- ❌ Can access ANY table/data
- ❌ Broad permissions if key leaks

**Better (RPC with Security Definer):**
- ✅ Only specific operations allowed
- ✅ Minimized damage if compromised
- ✅ Audit trail of exact operations
- ❌ More complex to implement
- ❌ Need separate function for each operation

#### When to Implement This

**Stick with service_role for now if:**
- You're in MVP/testing phase
- Limited users/data
- Code is not public
- You trust your deployment security

**Upgrade to RPC when:**
- Going to production with real users
- Handling sensitive data
- Code is open source
- Want defense-in-depth

#### How to Implement (Future Enhancement)

**Step 1: Create RPC Function in Supabase**

```sql
-- Create function that can only update subscriptions
CREATE OR REPLACE FUNCTION public.upsert_user_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows function to bypass RLS
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF p_status NOT IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Upsert subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.upsert_user_subscription TO anon, authenticated;
```

**Step 2: Update Webhook Handler**

```typescript
// Instead of using service_role client:
const supabase = createServiceClient();

// Use anon client and call RPC:
const supabase = createClient(); // Regular anon key

await supabase.rpc('upsert_user_subscription', {
  p_user_id: userId,
  p_stripe_customer_id: subscription.customer,
  p_stripe_subscription_id: subscription.id,
  p_stripe_price_id: subscription.items.data[0].price.id,
  p_status: subscription.status,
  p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
  p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  p_cancel_at_period_end: subscription.cancel_at_period_end,
});
```

**Step 3: Remove Service Role Key**

No longer need `SUPABASE_SERVICE_ROLE_KEY` in environment variables!

#### Benefits of RPC Approach

1. **Minimized privileges:** Function can ONLY update subscriptions
2. **No service_role key needed:** Use regular anon key
3. **Audit trail:** Each function call is logged
4. **Input validation:** Function validates all inputs
5. **Easier testing:** Can test function directly in SQL editor

---

## Summary

### What We Have Now ✅

| Security Feature | Status | Production Ready? |
|-----------------|--------|-------------------|
| Signature Verification | ✅ Implemented | Yes |
| Idempotency | ✅ Implemented | Yes |
| Service Role (Current) | ✅ Implemented | Yes for MVP |

### Future Enhancements 🔮

| Enhancement | Priority | When to Implement |
|------------|----------|-------------------|
| RPC Functions | Medium | Before scale/public launch |
| Webhook Logging | Low | For debugging/monitoring |
| Rate Limiting | Low | If abuse detected |

---

## Recommendation

**For your current stage (MVP/testing):**
- ✅ Current implementation is secure enough
- ✅ Signature verification prevents unauthorized webhooks
- ✅ Idempotency prevents duplicate processing
- ✅ Service role is fine for limited users

**Consider RPC upgrade when:**
- Launching to broader audience
- Open-sourcing code
- Handling more sensitive data
- Want defense-in-depth

---

## Additional Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use Vercel environment variables for production
- ✅ Rotate keys if exposed

### 2. Webhook Monitoring
- Monitor Stripe Dashboard for failed webhooks
- Set up alerts for repeated failures
- Log webhook events for debugging

### 3. Database Monitoring
- Check Supabase logs regularly
- Set up alerts for unusual activity
- Monitor RLS policy violations

### 4. Code Review
- Review webhook changes carefully
- Test with Stripe test mode first
- Verify idempotency works with retries

---

## Questions?

Refer to:
- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- Supabase Functions: https://supabase.com/docs/guides/database/functions
- Stripe Webhook docs: https://stripe.com/docs/webhooks
