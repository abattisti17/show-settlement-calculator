# Entitlements System Setup & Testing Guide

## Overview

Your app now has a flexible entitlements system that supports:
- **Stripe-backed subscriptions** (existing functionality)
- **Manual pro access grants** for dev/test/family/friends (NEW)

The system uses a new `user_entitlements` table as the single source of truth for access control.

## Architecture

```
┌─────────────────┐
│ Stripe Webhook  │──┐
└─────────────────┘  │
                     ├──► user_subscriptions (Stripe data mirror)
┌─────────────────┐  │
│ Manual SQL      │──┼──► user_entitlements (SOURCE OF TRUTH)
└─────────────────┘  │
                     │
                     └──► hasProAccess() ──► UI Access Control
```

## Step 1: Run the Migration

You need to apply the new database migration to create the `user_entitlements` table.

### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Push the migration to your database
cd /Users/battist/Documents/the-lab/settlements
supabase db push
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20260130201233_create_entitlements.sql`
3. Copy the entire contents
4. Paste into SQL Editor and run

### Verify Migration

After running the migration, verify the table exists:

```sql
-- In Supabase SQL Editor
select * from user_entitlements limit 1;
```

You should see an empty table with columns: `id`, `user_id`, `source`, `status`, `granted_by`, `granted_at`, `expires_at`, `metadata`, `created_at`, `updated_at`.

## Step 2: Grant Manual Access

Now you can grant pro access to anyone without requiring a Stripe payment.

### Find User ID by Email

First, find the user's UUID:

```sql
-- In Supabase SQL Editor
select id, email, created_at 
from auth.users 
where email = 'friend@example.com';
```

Copy the `id` value (it's a UUID like `a1b2c3d4-...`).

### Grant Lifetime Access

Replace `'USER_UUID_HERE'` with the actual user ID:

```sql
-- Grant lifetime pro access
insert into user_entitlements (user_id, source, status, expires_at, metadata)
values (
  'USER_UUID_HERE',
  'manual_comp',  -- or 'dev_account', 'test_account'
  'active',
  null,  -- null = lifetime access
  '{"reason": "Beta tester", "notes": "Granted on 2026-01-30"}'::jsonb
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();
```

### Grant Temporary Access (30 days)

```sql
insert into user_entitlements (user_id, source, status, expires_at, metadata)
values (
  'USER_UUID_HERE',
  'test_account',
  'active',
  now() + interval '30 days',  -- expires in 30 days
  '{"reason": "Testing period", "notes": "Temporary access"}'::jsonb
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();
```

### Revoke Access

```sql
update user_entitlements
set status = 'inactive', updated_at = now()
where user_id = 'USER_UUID_HERE';
```

### Source Types

- `stripe` - Automatically set by webhook for Stripe subscriptions
- `manual_comp` - Complimentary access (friends/family)
- `dev_account` - Developer accounts
- `test_account` - Testing accounts

## Step 3: Test the Implementation

### Test 1: Manual Grant

1. Grant yourself dev access using the SQL above (find your user ID first)
2. Refresh your app
3. You should see the calculator without needing a Stripe subscription
4. Dashboard should show "Pro Access" with "Developer" access type
5. Billing management button should be HIDDEN (since it's not a Stripe subscription)

### Test 2: Stripe Integration (if you have Stripe configured)

1. Create a new test user
2. Subscribe via Stripe Checkout (use test card: `4242 4242 4242 4242`)
3. Check both tables in Supabase:
   ```sql
   -- Should have record in user_subscriptions
   select * from user_subscriptions where user_id = 'USER_ID';
   
   -- Should ALSO have record in user_entitlements with source='stripe'
   select * from user_entitlements where user_id = 'USER_ID';
   ```
4. Verify the user can access the calculator
5. Cancel the subscription in Stripe Customer Portal
6. Verify `user_entitlements.status` becomes `'inactive'`
7. Verify the user loses access to calculator

### Test 3: Expiration

1. Grant yourself temporary access with `expires_at` set to yesterday:
   ```sql
   update user_entitlements
   set expires_at = now() - interval '1 day'
   where user_id = 'YOUR_USER_ID';
   ```
2. Refresh the app
3. You should see the paywall (access expired)

### Test 4: RLS Security

1. Open browser console on the app
2. Try to grant yourself access from the client:
   ```javascript
   // This should FAIL (only service_role can write)
   const supabase = createClient();
   await supabase.from('user_entitlements').insert({
     user_id: 'your-user-id',
     source: 'manual_comp',
     status: 'active'
   });
   ```
3. You should get a permission denied error ✅

## Step 4: Monitor Logs

After testing, check for any errors:

1. **Supabase Logs**: Dashboard → Logs → Filter by "user_entitlements"
2. **Stripe Webhook Logs**: Stripe Dashboard → Webhooks → Click your endpoint → View attempts
3. **App Console**: Check for any client-side errors

## Troubleshooting

### Migration fails with "function handle_updated_at already exists"

This is expected if you already have the function from the `user_subscriptions` migration. The migration is safe to re-run.

### User has Stripe subscription but no entitlement

The entitlement is created when:
- New subscription is created (checkout.session.completed)
- Subscription is updated (customer.subscription.updated)

To backfill manually:
```sql
insert into user_entitlements (user_id, source, status, expires_at, metadata)
select 
  user_id,
  'stripe',
  case when status in ('active', 'trialing') then 'active' else 'inactive' end,
  current_period_end,
  jsonb_build_object('stripe_subscription_id', stripe_subscription_id)
from user_subscriptions
on conflict (user_id) do nothing;
```

### Access check returns false for valid entitlement

Check the database:
```sql
select 
  user_id,
  source,
  status,
  expires_at,
  case 
    when status != 'active' then 'Status not active'
    when expires_at is not null and expires_at < now() then 'Expired'
    else 'Valid'
  end as access_check
from user_entitlements
where user_id = 'USER_ID';
```

## Usage in Code

The new access control functions are in `lib/access/`:

### Server-side (Server Components, API Routes)
```typescript
import { hasProAccess, getEntitlementDetails } from "@/lib/access/entitlements";

// Simple check
const hasAccess = await hasProAccess(userId);

// Get full details
const { hasAccess, entitlement } = await getEntitlementDetails(userId);
if (hasAccess && entitlement?.source !== 'stripe') {
  // Show comped access badge
}
```

### Client-side (Client Components)
```typescript
import { hasProAccessClient, getEntitlementDetailsClient } from "@/lib/access/entitlements-client";

// Simple check
const hasAccess = await hasProAccessClient();

// Get full details
const { hasAccess, entitlement } = await getEntitlementDetailsClient();
```

## SQL Helper Function

A helper function is available in the database:

```sql
-- Check if user has active entitlement
select has_active_entitlement('USER_UUID_HERE');
-- Returns: true or false
```

## Files Changed

### New Files
- `supabase/migrations/20260130201233_create_entitlements.sql` - Database migration
- `lib/access/entitlements.ts` - Server-side access functions
- `lib/access/entitlements-client.ts` - Client-side access functions
- `ENTITLEMENTS_SETUP.md` - This guide

### Modified Files
- `app/api/webhooks/stripe/route.ts` - Syncs entitlements on Stripe events
- `app/page.tsx` - Uses new access check
- `app/dashboard/page.tsx` - Shows entitlement source, hides billing for non-Stripe

### Deprecated (kept for compatibility)
- `lib/stripe/subscription.ts` - Still works, but prefer new functions
- `lib/stripe/subscription-client.ts` - Still works, but prefer new functions

## Next Steps

1. ✅ Run the migration
2. ✅ Grant yourself dev access
3. ✅ Test access in the app
4. ✅ Test Stripe integration (if configured)
5. Grant access to friends/family/testers as needed
6. Monitor logs for any issues

## Security Notes

✅ **Users cannot grant themselves access** - RLS prevents client writes  
✅ **Service role only used server-side** - Webhooks and manual SQL  
✅ **Stripe webhooks verify signatures** - Unchanged from existing implementation  
✅ **Access checks happen server-side** - Client checks are convenience only  
✅ **Expiration is enforced** - Checked on every access  
✅ **Audit trail included** - source, granted_at, metadata tracked  

## Questions?

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Check Supabase logs
3. Check Stripe webhook logs (for subscription issues)
4. Verify RLS policies are enabled: `select * from user_entitlements` should only show your own record when logged in

---

**🎉 Entitlements system is ready to use!**

You can now grant pro access to anyone without requiring a Stripe payment, while still supporting paid subscriptions for everyone else.
