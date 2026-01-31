-- Create user_entitlements table for flexible access control
-- Supports both Stripe-backed subscriptions and manual grants (dev/test/comped users)

-- Create the table
create table if not exists "public"."user_entitlements" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "source" text not null check (source in ('stripe', 'manual_comp', 'dev_account', 'test_account')),
  "status" text not null check (status in ('active', 'inactive', 'expired')),
  "granted_by" uuid,
  "granted_at" timestamp with time zone not null default now(),
  "expires_at" timestamp with time zone,
  "metadata" jsonb not null default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table "public"."user_entitlements" enable row level security;

-- Add primary key
create unique index if not exists "user_entitlements_pkey" on "public"."user_entitlements" using btree ("id");
alter table "public"."user_entitlements" add constraint "user_entitlements_pkey" primary key using index "user_entitlements_pkey";

-- One entitlement per user (enables upsert pattern)
create unique index if not exists "user_entitlements_user_id_unique" on "public"."user_entitlements" using btree ("user_id");

-- Add foreign key to auth.users
alter table "public"."user_entitlements" add constraint "user_entitlements_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade not valid;
alter table "public"."user_entitlements" validate constraint "user_entitlements_user_id_fkey";

-- Add foreign key for granted_by (optional, for manual grants)
alter table "public"."user_entitlements" add constraint "user_entitlements_granted_by_fkey" foreign key ("granted_by") references "auth"."users"("id") on delete set null not valid;
alter table "public"."user_entitlements" validate constraint "user_entitlements_granted_by_fkey";

-- Grant permissions
grant select on table "public"."user_entitlements" to "anon";
grant select on table "public"."user_entitlements" to "authenticated";

grant delete on table "public"."user_entitlements" to "service_role";
grant insert on table "public"."user_entitlements" to "service_role";
grant references on table "public"."user_entitlements" to "service_role";
grant select on table "public"."user_entitlements" to "service_role";
grant trigger on table "public"."user_entitlements" to "service_role";
grant truncate on table "public"."user_entitlements" to "service_role";
grant update on table "public"."user_entitlements" to "service_role";

-- Drop existing policy if it exists (for migration idempotency)
drop policy if exists "entitlements_select_own" on "public"."user_entitlements";

-- RLS Policy: Users can only view their own entitlement
create policy "entitlements_select_own"
on "public"."user_entitlements"
as permissive
for select
to public
using (auth.uid() = user_id);

-- Add updated_at trigger (reuses existing handle_updated_at function from user_subscriptions migration)
drop trigger if exists "handle_user_entitlements_updated_at" on "public"."user_entitlements";

create trigger "handle_user_entitlements_updated_at"
before update on "public"."user_entitlements"
for each row
execute function "public"."handle_updated_at"();

-- Helper function: Check if a user has active entitlement
create or replace function "public"."has_active_entitlement"(check_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  entitlement record;
begin
  select status, expires_at into entitlement
  from public.user_entitlements
  where user_id = check_user_id;
  
  -- No entitlement found
  if not found then
    return false;
  end if;
  
  -- Check if active
  if entitlement.status != 'active' then
    return false;
  end if;
  
  -- Check if expired (null expires_at means lifetime access)
  if entitlement.expires_at is not null and entitlement.expires_at < now() then
    return false;
  end if;
  
  return true;
end;
$$;
