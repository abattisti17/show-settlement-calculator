# Stripe Integration Testing Guide

This guide outlines how to test the complete Stripe subscription flow.

## Prerequisites

Before testing, ensure:

1. Database migration has been run (see `STRIPE_SETUP.md` Step 1)
2. All environment variables are configured (see `STRIPE_SETUP.md` Step 5)
3. Stripe webhook is set up for local development (see `STRIPE_SETUP.md` Step 6)
4. Development server is running (`npm run dev`)

## Test Scenarios

### Scenario 1: New User Subscription Flow

**Goal:** Test a new user subscribing to the service

1. **Create a new user account**
   - Navigate to `/login`
   - Sign up with a new email
   - Verify you receive the confirmation email (if using email confirmation)

2. **Access the paywall**
   - After login, try to access the calculator at `/`
   - ✅ **Expected:** You should see the paywall message "Subscribe to Access the Calculator"
   - ✅ **Expected:** The calculator form should be hidden

3. **Navigate to dashboard**
   - Go to `/dashboard` or click "View Plans & Subscribe"
   - ✅ **Expected:** You should see the subscription prompt with pricing and features
   - ✅ **Expected:** "Subscribe Now" button is visible

4. **Initiate checkout**
   - Click "Subscribe Now"
   - ✅ **Expected:** You're redirected to Stripe Checkout page
   - ✅ **Expected:** Price matches what you configured ($10/month)

5. **Complete payment with test card**
   - Enter test card: `4242 4242 4242 4242`
   - Expiration: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
   - Click "Subscribe"
   - ✅ **Expected:** Payment succeeds

6. **Verify redirect**
   - ✅ **Expected:** You're redirected back to `/dashboard?session_id=...`
   - ✅ **Expected:** Dashboard shows "Active Subscription" status
   - ✅ **Expected:** "Manage Billing" button is visible

7. **Access the calculator**
   - Navigate to `/`
   - ✅ **Expected:** Calculator form is now visible
   - ✅ **Expected:** No paywall is shown
   - ✅ **Expected:** You can perform calculations

8. **Verify database**
   - Go to Supabase dashboard → Table Editor → `user_subscriptions`
   - ✅ **Expected:** New row exists with:
     - `user_id` matches your user
     - `status` = "active"
     - `stripe_customer_id` is populated
     - `stripe_subscription_id` is populated
     - `current_period_start` and `current_period_end` are set

### Scenario 2: Existing Subscriber

**Goal:** Test that a user with an active subscription can access the calculator

1. **Log in with subscribed account**
   - Use the account from Scenario 1
   - Navigate to `/dashboard`
   - ✅ **Expected:** "Active Subscription" status is shown

2. **Access calculator**
   - Navigate to `/`
   - ✅ **Expected:** Calculator is immediately accessible
   - ✅ **Expected:** No paywall or loading delay

3. **Verify subscription persistence**
   - Log out and log back in
   - ✅ **Expected:** Still subscribed, can access calculator

### Scenario 3: Customer Portal - Update Payment Method

**Goal:** Test updating payment method via Customer Portal

1. **Access customer portal**
   - Go to `/dashboard` with a subscribed account
   - Click "Manage Billing"
   - ✅ **Expected:** Redirected to Stripe Customer Portal

2. **Update payment method**
   - Click "Update payment method"
   - Enter new test card: `5555 5555 5555 4444` (Mastercard)
   - Expiration: Any future date
   - CVC: Any 3 digits
   - Save changes
   - ✅ **Expected:** Payment method updated successfully

3. **Return to app**
   - Click "Return to [Your App Name]"
   - ✅ **Expected:** Redirected back to `/dashboard`
   - ✅ **Expected:** Subscription still active

### Scenario 4: Customer Portal - Cancel Subscription

**Goal:** Test subscription cancellation flow

1. **Cancel subscription**
   - Go to `/dashboard` with a subscribed account
   - Click "Manage Billing"
   - In Customer Portal, click "Cancel subscription"
   - Choose when to cancel:
     - **Immediately:** Subscription ends now
     - **At period end:** Subscription ends at the end of current billing period
   - Confirm cancellation

2. **Verify cancellation (immediate)**
   - If you chose immediate cancellation:
   - ✅ **Expected:** Webhook updates database immediately
   - ✅ **Expected:** Dashboard shows no active subscription
   - ✅ **Expected:** Calculator shows paywall again

3. **Verify cancellation (at period end)**
   - If you chose end of period cancellation:
   - ✅ **Expected:** Dashboard shows "Your subscription will end on [date]"
   - ✅ **Expected:** Calculator remains accessible until period end
   - ✅ **Expected:** Database `cancel_at_period_end` = true

4. **Verify database**
   - Check `user_subscriptions` table
   - ✅ **Expected:** `status` = "canceled" (if immediate) or still "active" with `cancel_at_period_end` = true

### Scenario 5: Failed Payment

**Goal:** Test handling of failed payment during checkout

1. **Attempt subscription with declined card**
   - Create new user or use unsubscribed account
   - Start subscription checkout
   - Use declined test card: `4000 0000 0000 0002`
   - Complete form and submit
   - ✅ **Expected:** Payment is declined
   - ✅ **Expected:** Error message shown by Stripe
   - ✅ **Expected:** User remains on checkout page

2. **Retry with valid card**
   - Enter valid test card: `4242 4242 4242 4242`
   - Submit payment
   - ✅ **Expected:** Payment succeeds this time
   - ✅ **Expected:** Subscription is created

### Scenario 6: Webhook Events

**Goal:** Verify webhooks are working correctly

1. **Monitor webhook events**
   - Open Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - View "Recent events" tab

2. **Complete a subscription**
   - Perform Scenario 1
   - ✅ **Expected:** `checkout.session.completed` event appears
   - ✅ **Expected:** Event shows status "Succeeded"

3. **Cancel a subscription**
   - Perform Scenario 4
   - ✅ **Expected:** `customer.subscription.deleted` event appears (if immediate)
   - ✅ **Expected:** `customer.subscription.updated` event appears (if at period end)

4. **Check for failures**
   - ✅ **Expected:** No "Failed" status events
   - If there are failures, click to view error details

### Scenario 7: Multiple Sessions

**Goal:** Test subscription status across different browsers/devices

1. **Subscribe in Browser A**
   - Complete subscription in Chrome
   - Verify calculator access

2. **Log in from Browser B**
   - Open Firefox (or incognito Chrome)
   - Log in with same account
   - ✅ **Expected:** Subscription status syncs
   - ✅ **Expected:** Calculator is accessible

3. **Cancel in Browser A**
   - Return to Browser A
   - Cancel subscription

4. **Refresh Browser B**
   - Refresh page in Browser B
   - ✅ **Expected:** Subscription status updates
   - ✅ **Expected:** Calculator shows paywall

### Scenario 8: Edge Cases

**Goal:** Test unusual or edge case scenarios

1. **Already subscribed user tries to subscribe again**
   - Go to `/dashboard` with active subscription
   - Try clicking "Subscribe Now" (you may need to inspect/force the button)
   - ✅ **Expected:** API returns error "You already have an active subscription"

2. **Access API routes directly without auth**
   - Open browser console
   - Try: `fetch('/api/create-checkout-session', {method: 'POST'})`
   - ✅ **Expected:** Returns 401 Unauthorized

3. **Access calculator without JavaScript**
   - Disable JavaScript in browser
   - Navigate to `/`
   - ✅ **Expected:** Graceful degradation or loading state
   - ✅ **Expected:** No calculator functionality (expected)

## Monitoring Tools

### Stripe Dashboard

Monitor in real-time:
- **Customers:** See all your test customers
- **Subscriptions:** View active/canceled subscriptions
- **Events:** See all webhook events
- **Logs:** Check API request logs

### Supabase Dashboard

Monitor in real-time:
- **Table Editor:** View `user_subscriptions` table data
- **Database → Logs:** Check for query errors
- **Auth → Users:** View user accounts

### Browser DevTools

Monitor:
- **Console:** Check for JavaScript errors
- **Network:** Monitor API requests/responses
- **Application → Cookies:** Verify auth cookies

## Test Checklist

Before considering the integration complete, verify:

- [ ] New users see paywall on calculator page
- [ ] Subscribe button redirects to Stripe Checkout
- [ ] Successful payment creates subscription in database
- [ ] Subscribed users can access calculator
- [ ] Dashboard shows correct subscription status
- [ ] Manage Billing button opens Customer Portal
- [ ] Users can update payment method
- [ ] Users can cancel subscription
- [ ] Canceled users lose calculator access
- [ ] Webhooks are delivering successfully
- [ ] No TypeScript errors in build
- [ ] No console errors during normal flow
- [ ] Subscription persists across sessions
- [ ] Database RLS policies work correctly

## Troubleshooting

### Issue: Paywall still shows after successful payment

**Possible causes:**
- Webhook not delivered (check Stripe Dashboard → Webhooks)
- Webhook secret mismatch
- Database write failed (check Supabase logs)
- Browser cache (try hard refresh: Cmd+Shift+R / Ctrl+Shift+R)

**Solutions:**
- Verify webhook is configured and secret matches
- Check webhook delivery status in Stripe
- Clear browser cache and reload
- Check database for subscription record

### Issue: "Unauthorized" when clicking Subscribe

**Possible causes:**
- User not properly authenticated
- Auth cookie expired

**Solutions:**
- Log out and log back in
- Check browser console for auth errors
- Verify Supabase auth configuration

### Issue: Calculator still showing after cancellation

**Possible causes:**
- Subscription canceled at period end (still active until then)
- Webhook not processed yet
- Cache not cleared

**Solutions:**
- Check `cancel_at_period_end` flag in database
- Wait a few seconds and refresh
- Clear browser cache

## Performance Testing

Once basic functionality works:

1. **Test with slow network**
   - Open DevTools → Network → Throttling
   - Set to "Slow 3G"
   - Verify loading states appear
   - Verify no timeout errors

2. **Test rapid clicks**
   - Rapidly click "Subscribe Now" multiple times
   - ✅ **Expected:** Button disables after first click
   - ✅ **Expected:** Only one Checkout session created

3. **Test session timeout**
   - Start checkout but don't complete
   - Wait 24 hours
   - Try to complete checkout
   - ✅ **Expected:** Graceful error handling

## Next Steps

After all tests pass:

1. Review `STRIPE_SETUP.md` for production deployment steps
2. Switch to Live mode keys when ready
3. Test with real card (refund yourself afterward)
4. Set up monitoring and alerts for webhook failures
5. Document any customizations for your team
