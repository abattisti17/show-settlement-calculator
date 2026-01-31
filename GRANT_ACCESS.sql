-- GRANT ACCESS SQL SCRIPTS
-- Quick reference for granting manual pro access to users
-- Run these in Supabase SQL Editor

-- ============================================
-- STEP 1: Find User ID by Email
-- ============================================

select id, email, created_at 
from auth.users 
where email = 'friend@example.com';
-- Copy the 'id' value from the result


-- ============================================
-- STEP 2: Grant Access (choose one)
-- ============================================

-- Option A: Grant LIFETIME access (most common for comped users)
insert into user_entitlements (user_id, source, status, expires_at, metadata)
values (
  'PASTE_USER_ID_HERE',
  'manual_comp',  -- complimentary access
  'active',
  null,  -- null = lifetime access
  '{"reason": "Beta tester", "notes": "Granted by admin"}'::jsonb
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();


-- Option B: Grant TEMPORARY access (30 days)
insert into user_entitlements (user_id, source, status, expires_at, metadata)
values (
  'PASTE_USER_ID_HERE',
  'test_account',
  'active',
  now() + interval '30 days',  -- expires in 30 days
  '{"reason": "Testing period"}'::jsonb
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();


-- Option C: Grant DEV account access
insert into user_entitlements (user_id, source, status, expires_at, metadata)
values (
  'PASTE_USER_ID_HERE',
  'dev_account',
  'active',
  null,
  '{"reason": "Developer account"}'::jsonb
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();


-- ============================================
-- STEP 3: Verify Access
-- ============================================

select 
  e.user_id,
  u.email,
  e.source,
  e.status,
  e.expires_at,
  e.metadata,
  e.created_at,
  case 
    when e.status != 'active' then '❌ Status not active'
    when e.expires_at is not null and e.expires_at < now() then '❌ Expired'
    else '✅ Valid access'
  end as access_check
from user_entitlements e
join auth.users u on u.id = e.user_id
where e.user_id = 'PASTE_USER_ID_HERE';


-- ============================================
-- REVOKE ACCESS
-- ============================================

-- Set entitlement to inactive
update user_entitlements
set 
  status = 'inactive',
  metadata = metadata || '{"revoked_at": "now()", "revoked_reason": "Access ended"}'::jsonb,
  updated_at = now()
where user_id = 'PASTE_USER_ID_HERE';


-- ============================================
-- LIST ALL MANUAL GRANTS
-- ============================================

-- View all non-Stripe entitlements
select 
  u.email,
  e.source,
  e.status,
  e.expires_at,
  e.granted_at,
  e.metadata->>'reason' as reason
from user_entitlements e
join auth.users u on u.id = e.user_id
where e.source != 'stripe'
order by e.granted_at desc;


-- ============================================
-- BULK GRANT ACCESS (multiple users)
-- ============================================

-- Example: Grant access to multiple emails
insert into user_entitlements (user_id, source, status, expires_at, metadata)
select 
  u.id,
  'manual_comp',
  'active',
  null,
  '{"reason": "Beta group", "notes": "Bulk grant"}'::jsonb
from auth.users u
where u.email in (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
)
on conflict (user_id) do update set
  source = excluded.source,
  status = excluded.status,
  expires_at = excluded.expires_at,
  metadata = excluded.metadata,
  updated_at = now();


-- ============================================
-- BACKFILL STRIPE USERS TO ENTITLEMENTS
-- ============================================

-- If you have existing Stripe users without entitlements, run this once
insert into user_entitlements (user_id, source, status, expires_at, metadata)
select 
  s.user_id,
  'stripe',
  case when s.status in ('active', 'trialing') then 'active' else 'inactive' end,
  s.current_period_end,
  jsonb_build_object(
    'stripe_subscription_id', s.stripe_subscription_id,
    'stripe_customer_id', s.stripe_customer_id,
    'backfilled', true
  )
from user_subscriptions s
on conflict (user_id) do nothing;


-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Count users by access source
select 
  source,
  status,
  count(*) as user_count
from user_entitlements
group by source, status
order by source, status;

-- Find expiring access (next 7 days)
select 
  u.email,
  e.source,
  e.expires_at,
  e.metadata->>'reason' as reason
from user_entitlements e
join auth.users u on u.id = e.user_id
where e.expires_at between now() and now() + interval '7 days'
order by e.expires_at;

-- Find users with lifetime access
select 
  u.email,
  e.source,
  e.granted_at,
  e.metadata->>'reason' as reason
from user_entitlements e
join auth.users u on u.id = e.user_id
where e.expires_at is null
  and e.status = 'active'
order by e.granted_at desc;
