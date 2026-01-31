# Project History (append-only)

---
### 2026-01-30 — Implement Supabase authentication (email/password + magic link)
**Context:** Calculator was public and no-login. Goal: add authentication to prepare for saving settlements to DB. User wanted clean, correct implementation with both magic link and email/password login, with auth-protected calculator and one combined login page.
**Decision:** Implement full Supabase auth using `@supabase/ssr` best practices for Next.js App Router. Combined login/signup page with tab toggles. Calculator requires authentication; post-login redirects to dashboard.
**Changes:**
- Created `lib/supabase/client.ts` (browser client for Client Components)
- Created `lib/supabase/server.ts` (server client for Server Components/Actions)
- Created `lib/supabase/middleware.ts` (session refresh helper, later renamed to proxy.ts)
- Created `middleware.ts` (route protection, auth redirects, later renamed to proxy.ts)
- Created `app/login/page.tsx` + `app/login/login.css` (combined login/signup with email/password and magic link options)
- Created `app/dashboard/page.tsx` + `app/dashboard/dashboard.css` (post-login landing page)
- Created `app/auth/callback/route.ts` (OAuth/magic link callback handler)
- Created `app/auth/signout/route.ts` (sign out route handler)
- Updated `app/page.tsx` to add user header with email display and logout button
- Updated `app/globals.css` to add user header styles
- Changed form placeholders from "e.g.," to "ex:" per user preference
**Supabase impact:** 
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in environment variables (both locally in `.env.local` and in Vercel settings)
- Requires Supabase redirect URLs configured: `http://localhost:3000/auth/callback` (dev) and production domain callback URL
- Uses existing RLS-enabled tables (public.shows, public.share_links) — no schema changes
**Tradeoffs:**
- Calculator now requires login (trade: simplicity for data persistence capability)
- Two auth methods (password + magic link) adds UI complexity but improves UX flexibility
- Server-side auth checks on every request add minimal latency but ensure security
**Rollback:** Delete all new files listed above, revert changes to `app/page.tsx` and `app/globals.css`. Remove Supabase env vars from Vercel if needed.
**Next:** Implement saving/loading calculator results to `public.shows` table. Add share link generation using `public.share_links` table.
---

---
### 2026-01-30 — Update form placeholders from "e.g.," to "ex:"
**Context:** User requested shorter, cleaner placeholder text format in calculator form inputs.
**Decision:** Replace all instances of "e.g.," with "ex:" for brevity and modern UX feel.
**Changes:**
- Updated 8 placeholder strings in `app/page.tsx` (artist name, ticket price, tickets sold, tax rate, expenses, guarantee, percentage)
- Changed comment in type definition from "e.g.," to "ex:"
**Supabase impact:** None. Pure UI text change.
**Tradeoffs:**
- "ex:" is shorter but slightly less formal than "e.g.," — preference is subjective
- Consistent across all form inputs
**Rollback:** Find/replace "ex:" back to "e.g.," in `app/page.tsx`
**Next:** None — cosmetic change complete.
---

---
### 2026-01-30 — Debug Vercel build failure (missing env vars)
**Context:** After implementing auth and pushing to GitHub/Vercel, build failed silently after "Running TypeScript..." with no error message in Vercel UI. Local `npm run build` worked perfectly.
**Decision:** Identified root cause as missing environment variables on Vercel. `.env.local` is gitignored (correctly), so Vercel had no access to Supabase credentials, causing silent build failures.
**Changes:**
- No code changes
- Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel project environment variables (Settings → Environment Variables)
- Set both variables for all three environments (Production, Preview, Development)
**Supabase impact:** None. Just configuration.
**Tradeoffs:**
- Manual step required for every deployment environment
- Could document this in README for future reference
**Rollback:** Remove env vars from Vercel if needed (app will fail to build without them).
**Next:** Update Supabase callback URLs to include production Vercel domain. Monitor successful Vercel deployment.
---

---
### 2026-01-30 — Migrate from middleware to proxy (Next.js 16)
**Context:** Vercel deployments showed deprecation warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead." This is a Next.js 16 breaking change requiring file and function renames.
**Decision:** Migrate to the new proxy convention to eliminate deprecation warnings and align with Next.js 16 best practices.
**Changes:**
- Renamed `/middleware.ts` → `/proxy.ts`
- Renamed `export async function middleware()` → `export async function proxy()` in `/proxy.ts`
- Renamed `/lib/supabase/middleware.ts` → `/lib/supabase/proxy.ts`
- Updated import in `/proxy.ts` from `'./lib/supabase/middleware'` → `'./lib/supabase/proxy'`
- Updated comments in both files to reference "proxy" instead of "middleware"
**Supabase impact:** None. Authentication logic and session handling remain identical.
**Tradeoffs:**
- Purely cosmetic/naming change; no functional differences
- Proxy runs on Node.js runtime by default (vs Edge) giving full Node.js API access
**Rollback:** `git revert <commit-hash>` (renames files back to middleware.ts and reverts function/import names)
**Next:** Monitor next Vercel deployment to confirm deprecation warning is resolved.
---

---
### 2026-01-30 — Set up Supabase CLI and sync remote schema
**Context:** Need to install Supabase CLI and pull existing schema from remote database to local repo before adding Stripe tables. This ensures migrations are properly tracked and don't conflict with existing tables.
**Decision:** Install Supabase CLI via Homebrew, authenticate, link to remote project, and pull existing schema into migration files.
**Changes:**
- Installed Supabase CLI v2.72.7 via Homebrew
- Fixed Homebrew permissions issues (`/opt/homebrew/Library/Taps`)
- Ran `supabase init` to initialize local config
- Ran `supabase login` to authenticate
- Ran `supabase link --project-ref ikognfeisqcyxpoxemcu` to connect to remote
- Repaired migration history for existing remote migration
- Ran `supabase db pull` to pull existing schema (creates `supabase/` folder)
- Created migration files:
  - `20260130230242_remote_schema.sql` (empty, repaired history)
  - `20260130231757_remote_schema.sql` (existing shows + share_links tables)
  - `20260130232250_add_user_subscriptions.sql` (new Stripe subscription table)
- Ran `supabase db push` to apply Stripe migration to remote database
**Supabase impact:**
- New table: `public.user_subscriptions` created in remote database
- Existing tables (shows, share_links) now tracked in local migrations
- Local repo now synced with remote database schema
- `.gitignore` updated to ignore Supabase local dev files
**Tradeoffs:**
- First-time Docker image downloads took several minutes
- Migration history had to be repaired due to existing remote migrations
- Now have proper version control of database schema
**Rollback:** Drop `user_subscriptions` table, delete migration files, run `supabase db push` with older migrations
**Next:** Configure Stripe Dashboard and test subscription flow

---
### 2026-01-30 — Implement Stripe subscription paywall
**Context:** Need to monetize the calculator app with a subscription model. User wants a full paywall where subscription is required to access the calculator, with single-tier pricing ($10/month) and customer self-service via Stripe Customer Portal.
**Decision:** Implement Stripe Checkout for subscriptions with webhook-based sync to Supabase, subscription status checking on all pages, and Customer Portal integration for billing management.
**Changes:**
- Added `stripe@latest` npm package
- Created Supabase table `user_subscriptions` (with RLS) to track subscription status
- Created `lib/stripe/server.ts` - Stripe API utilities (checkout, portal, customer management)
- Created `lib/stripe/subscription.ts` - Subscription status helpers for client and server
- Created `lib/supabase/service.ts` - Service role client for webhook operations (bypasses RLS)
- Created `app/api/create-checkout-session/route.ts` - POST endpoint to create Stripe Checkout sessions
- Created `app/api/create-portal-session/route.ts` - POST endpoint to create Customer Portal sessions
- Created `app/api/webhooks/stripe/route.ts` - Webhook handler for Stripe events (checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed)
- Created `app/dashboard/SubscribeButton.tsx` - Client component for subscription button
- Created `app/dashboard/ManageBillingButton.tsx` - Client component for billing portal button
- Updated `app/dashboard/page.tsx` - Added subscription status UI (active vs. no subscription views)
- Updated `app/dashboard/dashboard.css` - Added styles for subscription components
- Updated `app/page.tsx` - Added subscription check and paywall for calculator access
- Updated `app/globals.css` - Added paywall and loading state styles
- Created `supabase/migrations/20260130_create_user_subscriptions.sql` - Database migration script
- Created `STRIPE_SETUP.md` - Comprehensive setup guide for Stripe integration
- Created `TESTING_GUIDE.md` - Testing scenarios and checklist
- Updated `.env.local` - Added Stripe keys and Supabase service role key (with placeholder values)
**Supabase impact:**
- New table: `public.user_subscriptions` (stores Stripe subscription data)
- RLS enabled: Users can only view their own subscription
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var for webhook operations
**Tradeoffs:**
- Calculator now requires paid subscription (trade: revenue for user friction)
- Added complexity with webhook handling and Stripe integration
- Depends on external service (Stripe) for payment processing
- Monthly recurring cost for users ($10/month initially)
**Rollback:** Delete all new Stripe-related files, drop `user_subscriptions` table, remove Stripe env vars, revert changes to `app/page.tsx` and `app/dashboard/page.tsx` to remove subscription checks
**Next:** 
1. Run database migration in Supabase dashboard
2. Configure Stripe Dashboard (create product, get API keys, set up webhook)
3. Add environment variables to Vercel
4. Test complete subscription flow with Stripe test cards
5. Switch to live mode when ready to accept real payments
---

---
### 2026-01-30 — Implement entitlements system for manual pro access grants
**Context:** Stripe subscription is the only way to get pro access. User wants ability to manually grant lifetime/temporary access to dev accounts, test accounts, friends/family ("comped" users) without requiring Stripe payments. Need flexible system that supports both Stripe-backed subscriptions and manual grants.
**Decision:** Create `user_entitlements` table as single source of truth for access control. Keep `user_subscriptions` as Stripe data mirror. Stripe webhooks sync to both tables. Manual grants bypass Stripe entirely via SQL inserts. Access checks query entitlements only.
**Changes:**
- Created `supabase/migrations/20260130201233_create_entitlements.sql` - New user_entitlements table with RLS
- Created `lib/access/entitlements.ts` - Server-side access functions (hasProAccess, getUserEntitlement, getEntitlementDetails)
- Created `lib/access/entitlements-client.ts` - Client-side access functions (hasProAccessClient, getUserEntitlementClient, getEntitlementDetailsClient)
- Updated `app/api/webhooks/stripe/route.ts` - All webhook handlers now sync to entitlements table (handleCheckoutSessionCompleted, handleSubscriptionUpdated, handleSubscriptionDeleted, handleInvoicePaymentFailed)
- Updated `app/page.tsx` - Replaced hasActiveSubscriptionClient() with hasProAccessClient()
- Updated `app/dashboard/page.tsx` - Replaced hasActiveSubscription() with hasProAccess(), shows entitlement source (Stripe vs manual), hides billing buttons for non-Stripe access
- Created `ENTITLEMENTS_SETUP.md` - Complete setup and testing guide
- Created `GRANT_ACCESS.sql` - SQL script library for manual access grants
**Supabase impact:**
- New table: `public.user_entitlements` (id, user_id, source, status, granted_by, granted_at, expires_at, metadata)
- RLS: Users can SELECT their own entitlement only; only service_role can write
- Source types: 'stripe', 'manual_comp', 'dev_account', 'test_account'
- Status types: 'active', 'inactive', 'expired'
- Helper function: `has_active_entitlement(user_id uuid) returns boolean`
- Unique constraint on user_id (one entitlement per user, upsert pattern)
**Tradeoffs:**
- Two tables to maintain (user_subscriptions + user_entitlements) but clean separation of concerns
- Manual grants require SQL access (Supabase dashboard) - simple but not a UI
- Entitlements can expire (temporary grants) or be lifetime (null expires_at)
- Stripe subscriptions overwrite manual grants for that user (last write wins on upsert)
**Rollback:** Drop user_entitlements table, delete migration and new lib/access/ files, revert webhook and UI changes to use old subscription functions
**Next:** 
1. Run `supabase db push` to apply entitlements migration
2. Grant dev access to self via SQL (test manual grant flow)
3. Test Stripe subscription creates entitlement with source='stripe'
4. Verify RLS prevents client writes to entitlements
5. Grant access to friends/family/testers as needed
---

---
### 2026-01-30 — Implement dashboard show saving and listing functionality
**Context:** Calculator was ephemeral with no persistence. User needed ability to save shows to database, list all saved shows on dashboard, and reopen shows for editing. This completes the MVP show management functionality.
**Decision:** Implement full CRUD for shows using existing `public.shows` table. Transform dashboard from subscription-only view to shows list. Add save button to calculator header, support URL params for loading shows, and maintain backward compatibility with subscription UI.
**Changes:**
- Updated `app/page.tsx`:
  - Added `showName` field to `FormData` interface and form state
  - Added Show Name input field in Show Info section
  - Added state for `currentShowId`, `saveStatus`, `saveMessage`
  - Implemented `handleSaveShow()` function with insert/update logic
  - Added URL param support with `useSearchParams()` to load shows via `?showId=uuid`
  - Added `loadShow()` effect to fetch and hydrate show data on mount
  - Updated user header with "Save Show", "Back to Dashboard" buttons and save status display
  - Wrapped component in Suspense boundary to fix Next.js prerender error
- Updated `app/dashboard/page.tsx`:
  - Added `formatRelativeTime()` helper function for timestamps
  - Fetched user's shows from Supabase ordered by `updated_at DESC`
  - Completely redesigned dashboard layout for show management:
    - Header with "Create New Show" button
    - Shows list displaying show cards with title, artist, timestamp
    - Empty state when no shows exist
    - Compact subscription info moved to footer
- Updated `app/globals.css`:
  - Added `.user-header-left` and `.user-header-actions` for new header layout
  - Added `.save-show-btn` styles with gradient background and disabled state
  - Added `.dashboard-link-btn` styles for back navigation
  - Added `.save-status-message` with success/error variants
  - Updated responsive breakpoints for new header layout
- Updated `app/dashboard/dashboard.css`:
  - Changed `.dashboard-container` from centered flex to top-aligned grid
  - Added `.dashboard-top-header` with title and create button
  - Added `.shows-list` grid layout (responsive)
  - Added `.show-card` with hover effects, title, artist, timestamp display
  - Added `.empty-state` with icon and call-to-action
  - Added `.dashboard-footer` with compact subscription badge
  - Added comprehensive responsive styles for mobile
**Supabase impact:** 
- Uses existing `public.shows` table (no schema changes)
- Queries: INSERT (create show), UPDATE (edit show), SELECT (list shows, load single show)
- All operations protected by RLS policies (users can only access their own shows)
**Tradeoffs:**
- Dashboard is now shows-first instead of subscription-first (better for engaged users, less visible for billing)
- Added URL state management increases complexity but enables shareable links
- Suspense boundary required for `useSearchParams()` adds minor loading flicker
- No delete functionality yet (future enhancement)
**Rollback:** 
```bash
git revert <commit-hash>
```
Reverts all changes to calculator, dashboard, and CSS files. No database migrations to undo since table already existed.
**Next:** 
- Test complete flow: create show, save, list on dashboard, reopen, edit, update
- Consider adding delete show functionality
- Consider adding search/filter for large show lists
- Consider adding duplicate show feature
---

### 2026-01-31 — Public Share Page Implementation
**Context:** Implemented public sharing functionality for settlements. Users can now generate token-based share links for their saved shows, allowing anyone with the link to view a read-only settlement packet without authentication.
**Decision:** Built complete share link system with server-side security using service role to bypass RLS (Row Level Security) for public viewing while maintaining database security.
**Changes:**
- Created API routes for share link management:
  - `app/api/share-links/create/route.ts` - Generate new share links with crypto-random tokens
  - `app/api/share-links/toggle/route.ts` - Toggle is_active status
  - `app/api/share-links/get/route.ts` - Retrieve existing share link
- Created public share page: `app/s/[token]/page.tsx` - Server component that fetches show data using service role
- Created 404 page for invalid/inactive tokens: `app/s/[token]/not-found.tsx`
- Created ShareLinkManager component: `app/components/ShareLinkManager.tsx` - Client component with copy-to-clipboard and toggle functionality
- Integrated ShareLinkManager into calculator page (`app/page.tsx`) - displays after show is saved
- Added comprehensive CSS styling for share components and public settlement packet view in `app/globals.css`
**Supabase impact:** None - used existing `share_links` and `shows` tables with existing RLS policies. Service role key used for public read-only access.
**Tradeoffs:**
- Share links are permanent once created (not regeneratable) - provides stable URLs but can't revoke specific tokens without deactivation
- Service role bypasses RLS for public viewing - necessary for public access but requires careful security implementation
- 64-character hex tokens (32 random bytes) - strong security but long URLs
**Rollback:** Remove ShareLinkManager from page.tsx, delete app/components/ShareLinkManager.tsx, delete app/s/[token]/ directory, delete app/api/share-links/ directory. Remove CSS additions from globals.css (lines after "SHARE LINK MANAGER STYLES" comment).
**Next:**
- Test complete flow: create → save → generate share link → view publicly → toggle active/inactive
- Consider adding "Copy Link" button to dashboard show cards for quick sharing
- Consider adding analytics to track share link views
- Consider adding expiration dates for share links

**Critical Fix Applied:**
- Updated `proxy.ts` to allow public access to `/s/` routes (was blocking with login redirect)
- Added `isPublicSharePage` check to bypass authentication middleware for share links
---

### 2026-01-31 — Dashboard Share Links + Build Warning Cleanup
**Context:** Add quick share access on dashboard cards and remove debug instrumentation after successful share link fix. Build warnings were still present for metadataBase and baseline-browser-mapping.
**Decision:** Surface share link access on dashboard cards when available, clean debug logs, and address build warnings with minimal changes.
**Changes:**
- Added share link access on dashboard cards with active/inactive states in `app/dashboard/page.tsx`.
- Added dashboard styles for share actions in `app/dashboard/dashboard.css`.
- Removed debug instrumentation from share flow and auth/login routes.
- Added `metadataBase` to `app/layout.tsx` to silence Next metadata warning.
- Updated dev dependency `baseline-browser-mapping` to latest.
**Supabase impact:** None.
**Tradeoffs:**
- Dashboard share links are only shown if a share link already exists.
- Inactive links are shown as disabled text rather than a clickable link.
**Rollback:** Revert changes in `app/dashboard/page.tsx`, `app/dashboard/dashboard.css`, and `app/layout.tsx`; undo `baseline-browser-mapping` update in `package.json`/`package-lock.json`.
**Next:** Consider adding a “Generate Share Link” action directly from the dashboard.
---

### 2026-01-31 — Dashboard Card Click + Share Copy
**Context:** Improve dashboard UX so entire cards open and sharing copies a link instead of opening a new tab.
**Decision:** Make the card surface clickable via an overlay link and add a client-side copy button for active share links.
**Changes:**
- Added `ShareLinkCopyButton` client component in `app/dashboard/ShareLinkCopyButton.tsx`.
- Updated `app/dashboard/page.tsx` to use a card overlay link and copy-only share action.
- Adjusted `app/dashboard/dashboard.css` for overlay layering and action area behavior.
**Supabase impact:** None.
**Tradeoffs:**
- Card text is no longer selectable (overlay link captures clicks).
**Rollback:** Revert changes in `app/dashboard/page.tsx`, `app/dashboard/dashboard.css`, and delete `app/dashboard/ShareLinkCopyButton.tsx`.
**Next:** Consider adding a “Generate Share Link” action directly from the dashboard.
---

