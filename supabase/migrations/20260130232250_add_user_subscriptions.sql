-- Create user_subscriptions table to track Stripe subscription status
create table "public"."user_subscriptions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "stripe_customer_id" text unique,
  "stripe_subscription_id" text unique,
  "stripe_price_id" text,
  "status" text not null check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "cancel_at_period_end" boolean not null default false,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table "public"."user_subscriptions" enable row level security;

-- Create indexes for fast lookups
create index "user_subscriptions_user_id_idx" on "public"."user_subscriptions" using btree ("user_id");
create index "user_subscriptions_stripe_customer_id_idx" on "public"."user_subscriptions" using btree ("stripe_customer_id");
create index "user_subscriptions_stripe_subscription_id_idx" on "public"."user_subscriptions" using btree ("stripe_subscription_id");

-- Add primary key
create unique index "user_subscriptions_pkey" on "public"."user_subscriptions" using btree ("id");
alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" primary key using index "user_subscriptions_pkey";

-- Add foreign key to auth.users
alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade not valid;
alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

-- Grant permissions
grant delete on table "public"."user_subscriptions" to "anon";
grant insert on table "public"."user_subscriptions" to "anon";
grant references on table "public"."user_subscriptions" to "anon";
grant select on table "public"."user_subscriptions" to "anon";
grant trigger on table "public"."user_subscriptions" to "anon";
grant truncate on table "public"."user_subscriptions" to "anon";
grant update on table "public"."user_subscriptions" to "anon";

grant delete on table "public"."user_subscriptions" to "authenticated";
grant insert on table "public"."user_subscriptions" to "authenticated";
grant references on table "public"."user_subscriptions" to "authenticated";
grant select on table "public"."user_subscriptions" to "authenticated";
grant trigger on table "public"."user_subscriptions" to "authenticated";
grant truncate on table "public"."user_subscriptions" to "authenticated";
grant update on table "public"."user_subscriptions" to "authenticated";

grant delete on table "public"."user_subscriptions" to "service_role";
grant insert on table "public"."user_subscriptions" to "service_role";
grant references on table "public"."user_subscriptions" to "service_role";
grant select on table "public"."user_subscriptions" to "service_role";
grant trigger on table "public"."user_subscriptions" to "service_role";
grant truncate on table "public"."user_subscriptions" to "service_role";
grant update on table "public"."user_subscriptions" to "service_role";

-- RLS Policy: Users can only view their own subscription
create policy "user_subscriptions_select_own"
on "public"."user_subscriptions"
as permissive
for select
to public
using (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
create or replace function "public"."handle_updated_at"()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger
create trigger "handle_user_subscriptions_updated_at"
before update on "public"."user_subscriptions"
for each row
execute function "public"."handle_updated_at"();
