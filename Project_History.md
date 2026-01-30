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

