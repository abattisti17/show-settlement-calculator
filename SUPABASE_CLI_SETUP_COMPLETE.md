# Supabase CLI Setup - Complete ✅

## What We Accomplished

### 1. ✅ Installed Supabase CLI
- Installed Supabase CLI v2.72.7 via Homebrew
- Fixed Homebrew permissions issues
- Verified installation works

### 2. ✅ Authenticated and Linked Project
- Logged in to Supabase account
- Linked local repo to remote project (`ikognfeisqcyxpoxemcu`)
- Connection verified and working

### 3. ✅ Pulled Existing Schema
- Initialized Supabase in project (`supabase init`)
- Pulled existing database schema from remote
- Created migration files for existing tables:
  - `public.shows` - Your settlement calculations
  - `public.share_links` - Share link functionality
  - Both with RLS policies and proper foreign keys

### 4. ✅ Created Stripe Subscription Table
- Created new migration: `20260130232250_add_user_subscriptions.sql`
- Pushed to remote database successfully
- Table structure:
  - `user_id` → linked to `auth.users`
  - `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`
  - `status` (active, canceled, past_due, etc.)
  - `current_period_start`, `current_period_end`
  - `cancel_at_period_end`
  - Timestamps and RLS enabled

## Current Database Schema

Your Supabase database now has:

1. **`public.shows`** - Settlement calculations
   - RLS: Users can only access their own shows

2. **`public.share_links`** - Share functionality
   - RLS: Users can only manage links for their own shows

3. **`public.user_subscriptions`** - NEW! Stripe subscriptions
   - RLS: Users can only view their own subscription
   - Automatically synced by Stripe webhooks

## Migration Files Created

All migrations are in `supabase/migrations/`:

```
20260130230242_remote_schema.sql         # (empty, history repair)
20260130231757_remote_schema.sql         # Existing shows + share_links
20260130232250_add_user_subscriptions.sql # New Stripe table
```

## File Structure

```
settlements/
├── supabase/
│   ├── .gitignore          # Ignores local dev files
│   ├── config.toml         # Supabase CLI config
│   └── migrations/         # All your migrations
│       ├── 20260130230242_remote_schema.sql
│       ├── 20260130231757_remote_schema.sql
│       └── 20260130232250_add_user_subscriptions.sql
├── lib/
│   ├── stripe/             # Stripe utilities (already created)
│   └── supabase/           # Supabase clients (already created)
└── app/
    ├── api/                # API routes with Stripe endpoints
    └── ...
```

## What's Different From Before

**BEFORE (what we almost did):**
- Had a standalone migration SQL file in wrong location
- Would have created conflicts with existing schema
- No version control of database changes

**NOW (what we have):**
- ✅ Proper Supabase CLI setup
- ✅ All existing tables tracked in migrations
- ✅ New Stripe table properly integrated
- ✅ Full database version control
- ✅ Can safely push/pull schema changes

## Next Steps - Ready for Stripe!

Now that your database is set up correctly, you can proceed with Stripe configuration:

### 1. Get Service Role Key
You'll need this for webhooks. Get it from:
- Supabase Dashboard → Settings → API → `service_role` key
- Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### 2. Follow Stripe Setup Guide
Everything in the Stripe implementation is ready to go:
- ✅ Code is written
- ✅ Database table exists
- ✅ RLS policies active
- ⏳ Need Stripe Dashboard configuration
- ⏳ Need environment variables

**Read:** `STRIPE_SETUP.md` - Complete step-by-step instructions

### 3. Test Everything
After Stripe is configured:
- **Read:** `TESTING_GUIDE.md` - All test scenarios
- Use Stripe test cards
- Verify webhook events
- Test full subscription flow

## Useful Commands

Now that Supabase CLI is set up, you can use these commands:

```bash
# Pull latest schema from remote
supabase db pull

# Push local migrations to remote
supabase db push

# Create a new migration
supabase migration new <name>

# View migration status
supabase migration list

# Generate TypeScript types from your schema
supabase gen types typescript --local > types/supabase.ts
```

## Important Notes

### ⚠️ Migration Best Practices
1. **Never edit old migration files** - Always create new ones
2. **Test migrations locally first** - Use `supabase db push --dry-run`
3. **Commit migrations to git** - They're your database version history
4. **Pull before creating new migrations** - Stay in sync with remote

### 🔒 Security Reminders
- Service role key bypasses RLS - keep it secret!
- Only use service role key server-side (webhooks)
- RLS policies protect user data automatically
- Test that RLS works correctly

### 📝 What to Commit
**DO commit:**
- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `.gitignore` updates

**DON'T commit:**
- `.env.local` (secrets)
- `supabase/.temp/` (if it exists)
- Local database data

## Troubleshooting

### "Migration already exists"
If you get errors about existing migrations, check:
```bash
supabase migration list --remote
```
Compare with your local files in `supabase/migrations/`

### "Connection refused"
Make sure you're connected to your remote project:
```bash
supabase link --project-ref ikognfeisqcyxpoxemcu
```

### "Authentication required"
Re-authenticate if needed:
```bash
supabase login
```

## Summary

🎉 **You're all set!** Your local repo is now fully synced with your Supabase database, and the Stripe subscription table is live and ready to use.

**Next:** Configure Stripe Dashboard → Set environment variables → Test subscription flow

Refer to `STRIPE_SETUP.md` for the complete Stripe configuration guide!
