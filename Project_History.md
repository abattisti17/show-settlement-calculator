# Project History (append-only)

### 2025-02-25 — Settlement audit roadmap implementation
**Context:** Execute settlement audit roadmap (Phases 1–5): critical fixes, high-impact, quick wins, server-side recalculation, trust & export.
**Decision:** Implement all items that do not require schema/migration/RLS changes.
**Changes:**
- Phase 1: Show date field (FormData, Input, save/load); overpayment warning in computeSettlement; SharePopover confirmation + disable when stale; ShareLinkManager resultsStale.
- Phase 2: Balance due callout at top of summary; deal structure plain-language summary (getDealSummary); capacity/comps/negative expense validation.
- Phase 3: calculatedAt in summary; acknowledgments + show date in CSV; deal type tooltips.
- Phase 4: lib/settlement/calculate.ts (extract computeSettlement); app/api/shows/save/route.ts; calculator uses API instead of direct Supabase.
- Phase 5: Print styles for balance-due, overpayment, page-break; optional expected gross reconciliation field.
**Files:** app/calculator-content.tsx, app/components/SharePopover.tsx, app/components/ShareLinkManager.tsx, app/calculator.css, app/globals.css, lib/settlement/calculate.ts (new), app/api/shows/save/route.ts (new).
**Supabase impact:** None (same shows table, same RLS).
**Rollback:** Revert commits; delete lib/settlement/calculate.ts, app/api/shows/save/route.ts.
---
### 2025-02-25 — Parts 2–5: Settlement audit (compare, risk, roadmap, stress test)
**Context:** Complete audit Parts 2–5: compare app to real-world workflow, risk/trust audit, design-system-only roadmap, stress test scenario.
**Decision:** Document gaps, assumptions, missing validations, costly mistakes, reconciliation risks, UI friction; trust/transparency/audit/export needs; roadmap with critical fixes, high-impact, quick wins, structural, trust/export; stress test $10k guarantee vs 85/15.
**Changes:** Added `docs/SETTLEMENT_AUDIT_PARTS_2-5.md`.
**Supabase impact:** None.
**Rollback:** Delete docs/SETTLEMENT_AUDIT_PARTS_2-5.md.
---
### 2025-02-25 — Part 1: Real-world settlement workflow audit
**Context:** 5-part audit of the settlement app against real-world workflow. Part 1: map the actual end-to-end process from load-in through final payment.
**Decision:** Create a document mapping roles, documents, calculations, disputes, time-sensitive steps, and late-night behavior.
**Changes:** Added `docs/SETTLEMENT_REAL_WORLD_WORKFLOW.md` — roles (venue GM, promoter, tour manager, accountant, etc.), documents (deal memo, ticket report, receipts, settlement sheet), manual calculations, dispute zones, time-sensitive steps, fatigue/pressure behaviors.
**Supabase impact:** None.
**Rollback:** Delete docs/SETTLEMENT_REAL_WORLD_WORKFLOW.md.
---
### 2026-02-24 — /media as public route (no paywall)
**Context:** Media page should be public, not behind auth/paywall.
**Decision:** Add /media to proxy publicMarketingRoutes so unauthenticated users can access it.
**Changes:** `proxy.ts`: added '/media' to publicMarketingRoutes Set.
**Supabase impact:** None.
**Rollback:** Remove '/media' from publicMarketingRoutes in proxy.ts.
---
### 2026-02-24 — New /media page (logged-out show hub)
**Context:** User wanted a new logged-out page at /media for the show: articles, podcast episodes, livestream links, SEO-friendly, DSYS components only.
**Decision:** Add app/media with MarketingShell, PageHeader, Card, Button, Badge, Icon; metadata + CollectionPage + BreadcrumbList JSON-LD; sitemap and nav/footer links.
**Changes:**
- Added `app/media/page.tsx`: metadata via buildPageMetadata, JsonLd (CollectionPage, BreadcrumbList), semantic sections (Articles, Podcast episodes, Livestreams), placeholder cards with DSYS components.
- Added `app/media/media.css`: layout and card styling using design tokens.
- Updated `components/ui/MarketingShell.tsx`: Media link in nav (desktop + mobile) and footer.
- Updated `app/sitemap.ts`: added /media entry.
**Supabase impact:** None.
**Rollback:** Delete app/media/; revert MarketingShell.tsx and sitemap.ts.
---
### 2026-02-24 — Dark theme token fix (border + surface-strong)
**Context:** Dark theme had circular refs for --color-border and --color-surface-strong, so secondary buttons (e.g. Manage Billing) and borders had no distinct appearance.
**Decision:** Define explicit values in default :root so the token layer is correct; light theme unchanged (it already overrides these).
**Changes:** `app/globals.css`: --color-border set to rgba(255,255,255,0.1); --color-surface-strong set to rgba(255,255,255,0.07).
**Supabase impact:** None.
**Rollback:** Revert the two token lines in app/globals.css to var(--color-border) / var(--color-border).
---
### 2026-02-24 — Manage Billing contrast + account/dashboard via dsys
**Context:** Manage Billing button had low contrast (muted text on dark surface). User asked for fixes and for dashboard/account changes to use the design system.
**Decision:** Fix secondary/ghost button contrast in dsys; replace custom .action-btn with dsys .ds-btn-block.
**Changes:**
- `components/ui/Button.css`: Secondary and ghost variants now use `color: var(--color-text)` instead of `--color-text-muted` for sufficient contrast; added `.ds-btn-block { width: 100%; }`.
- `components/ui/AppAccountMenu.tsx`: Sign Out buttons use `className="ds-btn-block"` instead of `action-btn`.
- `app/dashboard/ManageBillingButton.tsx`: uses `className="ds-btn-block"`.
- `app/dashboard/SubscribeButton.tsx`: uses `className="ds-btn-block"`.
- `app/dashboard/dashboard.css`: removed `.action-btn` and `.dashboard-account-menu-actions .action-btn` style blocks.
**Supabase impact:** None.
**Rollback:** Revert Button.css, AppAccountMenu.tsx, ManageBillingButton.tsx, SubscribeButton.tsx, dashboard.css; restore action-btn styles.
---
### 2026-02-24 — Unified Copy link button + toast; cards full width
**Context:** User wanted one "Copy link" button per show: copy if link exists, generate then copy if not; show progress toast while generating. Cards should span full row.
**Decision:** Single CopyShareLinkButton for every show; DashboardToastProvider + toast UI; create share link via API when missing (and activate if inactive); explicit .show-card width: 100%.
**Changes:**
- Added `app/dashboard/DashboardToast.tsx` and `DashboardToast.css`: context + fixed toast with "Generating link…" / "Copied!" / "Link ready — copied!".
- Added `app/dashboard/CopyShareLinkButton.tsx`: one button that copies when link active, or calls POST /api/share-links/create (then toggle if inactive), then copies and shows toast.
- Updated `app/dashboard/page.tsx`: wrapped shows list in DashboardToastProvider; replaced ShareLinkCopyButton/Badge/span with CopyShareLinkButton for all shows; removed Badge import.
- Updated `app/dashboard/dashboard.css`: .show-card given width: 100%; responsive rule simplified to .share-show-btn only.
**Supabase impact:** None.
**Rollback:** Revert page.tsx, dashboard.css; delete DashboardToast.tsx/.css, CopyShareLinkButton.tsx; restore ShareLinkCopyButton and Badge/span share states.
---
### 2026-02-24 — Better "No share link" state on dashboard
**Context:** "No share link" was shown as a default Badge with monospace styling and looked jank.
**Decision:** Show "No share link" as subtle status text instead of a badge; reduce monospace on disabled share states.
**Changes:**
- `app/dashboard/page.tsx`: "No share link" now renders as `<span className="show-share-status show-share-status-none">` instead of Badge.
- `app/dashboard/dashboard.css`: Added `.show-share-status-none` (muted, normal font, sm); `.share-show-disabled` no longer uses monospace; responsive rule includes `.show-share-status-none`.
**Supabase impact:** None.
**Rollback:** Revert app/dashboard/page.tsx and app/dashboard/dashboard.css.
---
### 2026-02-24 — Dashboard show cards full-width rows, no text truncation
**Context:** User wanted dashboard show cards to span the full row (rows of shows, not grid) so text is not truncated.
**Decision:** Use single-column layout for shows list; allow title/artist text to wrap; make subscription card full width.
**Changes:**
- `app/dashboard/dashboard.css`: `.shows-list` changed from grid to `flex; flex-direction: column`; `.show-title` and `.show-artist` truncation removed (use `word-break: break-word`); `.dashboard-card` `max-width: 540px` removed; removed redundant `.shows-list` rule in 768px media query.
**Supabase impact:** None.
**Rollback:** Revert app/dashboard/dashboard.css.
---
### 2026-02-24 — Full dsys for calculator footer (SectionFooter + AuthorCard)
**Context:** Calculator footer used Card but had hardcoded background, spacing, avatar size, and line-height.
**Decision:** Add missing dsys tokens and two new components so the footer is fully design-system driven.
**Changes:**
- Added tokens to `:root`, light, and `prefers-color-scheme` blocks in `app/globals.css`:
  - `--color-overlay` (dark: rgba(0,0,0,0.2); light: rgba(0,0,0,0.06))
  - `--leading-loose: 1.7`
  - `--size-avatar-sm: 40px`, `--size-avatar: 64px`, `--size-avatar-lg: 96px`
- Added `components/ui/SectionFooter.tsx` + `.css`: full-bleed dark panel wrapper with max-width.
- Added `components/ui/AuthorCard.tsx` + `.css`: avatar + bio text card using all dsys tokens.
- Updated `app/page.tsx`: calculator footer uses `<SectionFooter>` + `<AuthorCard>`.
- Removed dead `calculator-footer-*` styles from `app/calculator.css`.
- Updated print styles in `globals.css` to hide `.ds-section-footer`.
- Added SectionFooter + AuthorCard section to design-system preview.
**Supabase impact:** None.
**Rollback:** Revert app/page.tsx, app/calculator.css, globals.css; delete SectionFooter.tsx/.css, AuthorCard.tsx/.css.
---
### 2026-02-24 — Calculator footer migrated to Card
**Context:** User requested migrating the about/contact footer at the bottom of the calculator to the design system.
**Decision:** Replace footer-content div with Card component; move layout styles to calculator.css.
**Changes:**
- Updated `app/page.tsx`: footer section now uses `<Card variant="default" padding="lg">` with calculator-footer-* classes.
- Updated `app/calculator.css`: added calculator-footer-section, calculator-footer-card, calculator-footer-inner, calculator-footer-photo, calculator-footer-text, etc.
- Updated `app/globals.css`: print styles now hide calculator-footer-section.
- Updated `CALCULATOR_MIGRATION.md`: component swap and dead CSS entry.
**Supabase impact:** None.
**Rollback:** Revert app/page.tsx, app/calculator.css, globals.css print block.
---
### 2026-02-24 — Unified app nav for logged-in pages
**Context:** Calculator used different nav (Dashboard/Calculator/Pricing links + sign out). User wanted same nav as dashboard whenever logged in.
**Decision:** Use AppShell with showNavLinks=false and account dropdown (AppAccountMenu) for all logged-in pages. MarketingShell for logged-out/landing.
**Changes:**
- Added `app/api/account/route.ts`: GET returns hasAccess, isStripeSource, entitlement, subscription for authenticated user.
- Added `components/ui/AppAccountMenu.tsx`: shared account dropdown (Badge, Manage Billing, Sign Out). Accepts optional initialData to skip fetch.
- Updated `app/page.tsx`: calculator/paywall/loading use showNavLinks={false} and userMenuContent={<AppAccountMenu />}.
- Updated `app/dashboard/page.tsx`: uses AppAccountMenu with initialData from server (no refetch).
**Supabase impact:** None.
**Tradeoffs:**
- Calculator fetches /api/account on mount for menu data; dashboard passes from server.
**Rollback:** Revert app/page.tsx, app/dashboard/page.tsx; delete app/api/account/route.ts, components/ui/AppAccountMenu.tsx.
**Next:** None.
---
### 2026-02-24 — Calculator page migrated to design system
**Context:** Migrate the main calculator page (/) to use design system components without changing logic.
**Decision:** Wrap in AppShell, replace inputs/selects/buttons/cards with design system components, add PageHeader.
**Changes:**
- Updated `app/page.tsx`:
  - Wrapped calculator (loading, paywall, main) in `AppShell` with signOutAction.
  - Replaced user header with `PageHeader` (title, description, action: Back to Dashboard + Save Show).
  - Replaced all `<input>` with `<Input>`, `<select>` with `<Select>`.
  - Replaced buttons: Calculate → Button primary lg; Save Show → Button primary sm; Print → Button secondary; Back to Dashboard → Button ghost sm.
  - Replaced form section, results card, paywall card with `Card`.
  - Removed unused handleSignOut (AppShell uses signOutAction).
- Added `app/calculator.css`: calculator layout, form grid, result rows, paywall, save status.
- Updated `app/globals.css`: added print rules for calculator-form-section, calculator-save-status, calculator-print-btn.
- Added `CALCULATOR_MIGRATION.md`: component swap list and dead CSS classes.
**Supabase impact:** None.
**Tradeoffs:**
- Legacy globals.css calculator styles kept for print compatibility and other pages.
- ShareLinkManager unchanged (uses share-link-* classes).
**Rollback:** Revert app/page.tsx, delete app/calculator.css, revert globals.css print block, delete CALCULATOR_MIGRATION.md.
**Next:** Optionally migrate ShareLinkManager buttons to Button.
---
### 2026-02-24 — Popover component + floating account dropdown
**Context:** Dashboard account dropdown did not float correctly (clipped/constrained by nav). User requested a popover-style dropdown instead of inline expansion.
**Decision:** Add a reusable `Popover` component that renders via `createPortal` to `document.body` with `position: fixed`, and refactor `AppShell` user menu to use it.
**Changes:**
- Added `components/ui/Popover.tsx`: controlled popover with trigger, portal rendering, fixed positioning from trigger rect, click-outside and Escape to close.
- Added `components/ui/Popover.css`: panel styling (background, border, shadow, z-index).
- Updated `components/ui/AppShell.tsx`: replaced inline dropdown with `Popover`; trigger remains email+chevron button.
- Updated `app/design-system/page.tsx`: added Popover section with `PopoverDemo` for preview.
**Supabase impact:** None.
**Tradeoffs:**
- Popover is a new design-system primitive; can be reused for other floating menus.
- Dropdown content (Badge, Button) already uses design-system components.
**Rollback:** Revert `components/ui/Popover.tsx`, `components/ui/Popover.css`, `components/ui/AppShell.tsx`, and design-system Popover section.
**Next:** None.
---
### 2026-02-24 — Dashboard account dropdown + nav link removal
**Context:** Dashboard navbar needed to be simplified and move billing/signout/subscription status into an account menu.
**Decision:** Hide app nav links on dashboard and use an email+chevron dropdown in `AppShell` for dashboard-specific account actions.
**Changes:**
- Updated `components/ui/AppShell.tsx`:
  - Added `showNavLinks` prop (default `true`) to hide Dashboard/Calculator/Pricing links when needed.
  - Added `userMenuContent` prop and built a chevron-triggered dropdown next to the account email.
  - Kept existing mobile menu behavior for routes that still use nav links.
- Updated `components/ui/AppShell.css`:
  - Added user-menu trigger, chevron rotation, and dropdown panel styles.
- Updated `app/dashboard/page.tsx`:
  - Passed `showNavLinks={false}`.
  - Moved subscription status, manage billing, and sign-out controls into `userMenuContent`.
  - Removed in-page dashboard footer action block and no-access sign-out button.
- Updated `app/dashboard/dashboard.css`:
  - Added `.dashboard-account-menu` and `.dashboard-account-menu-actions` layout styles for dropdown content.
**Supabase impact:** None.
**Tradeoffs:**
- Dashboard account actions are now one click deeper (in dropdown) for a cleaner main surface.
- `AppShell` gained dashboard-specific flexibility via additive props.
**Rollback:** Revert `components/ui/AppShell.tsx`, `components/ui/AppShell.css`, `app/dashboard/page.tsx`, and `app/dashboard/dashboard.css`.
**Next:** Optionally add click-outside/escape-close behavior to the dropdown if needed.
---
### 2026-02-24 — Dashboard migrated to design system components
**Context:** Needed to migrate `/dashboard` UI to shared design-system primitives without changing dashboard data/auth/subscription logic.
**Decision:** Keep all server/client logic intact and swap layout/styling wrappers to `AppShell`, `PageHeader`, `Card`, `Button`, and `Badge`.
**Changes:**
- Updated `app/dashboard/page.tsx`:
  - Wrapped dashboard content in `AppShell` (with `userEmail` and sign-out action).
  - Added `PageHeader` with "Create New Show" primary action.
  - Replaced show item wrappers, empty state wrapper, subscription footer wrapper, and no-access wrapper with `Card`.
  - Replaced CTA/action buttons with `Button` variants (primary/secondary/ghost/danger).
  - Replaced status labels with `Badge` (subscription and share-link states).
- Updated `components/ui/AppShell.tsx`:
  - Added optional `signOutAction` prop to support server-form sign-out in navbar (desktop + mobile) without client-side auth logic changes.
- Updated dashboard client controls:
  - `app/dashboard/SubscribeButton.tsx` now uses `Button` variant primary.
  - `app/dashboard/ManageBillingButton.tsx` now uses `Button` variant secondary.
  - `app/dashboard/ShareLinkCopyButton.tsx` now uses `Button` variant ghost.
- Updated `app/dashboard/dashboard.css`:
  - Removed old custom visual styles that overrode DS button variants for open/share buttons; kept only layout-specific rules.
**Supabase impact:** None.
**Tradeoffs:**
- `dashboard.css` now contains some legacy selectors that are no longer referenced and can be removed in a cleanup pass.
- Navbar sign-out now uses form action prop in shell to preserve existing server-post signout flow.
**Rollback:** Revert `app/dashboard/page.tsx`, `app/dashboard/dashboard.css`, dashboard button components, and `components/ui/AppShell.tsx`.
**Next:** Remove dead dashboard CSS selectors after visual QA.
---

---
### 2026-02-24 — Landing page migrated to design system components
**Context:** Needed to migrate the logged-out landing page to the new `components/ui` design system while preserving layout/content/behavior.
**Decision:** Keep existing section structure and copy, but swap nav/footer shell, CTA buttons, and card-like wrappers to `MarketingShell`, `Button`, and `Card`.
**Changes:**
- Updated `app/page.tsx` (`LandingPage`):
  - Wrapped landing content in `MarketingShell` (removes legacy landing nav/footer markup).
  - Replaced CTA/link-button elements with `Button` variants:
    - Primary CTAs -> `variant="primary"` (`/login`, `/pricing`)
    - Example packet CTA -> `variant="secondary"` with `target="_blank"` + `rel`.
  - Replaced card-like containers with `Card`:
    - Hero container, feature cards, panel sections, pricing panel, final CTA panel.
  - Kept landing content, section order, and copy unchanged.
- Updated `components/ui/Button.tsx`:
  - Converted props to a typed union for button vs anchor rendering.
  - Allowed anchor attributes (`target`, `rel`, etc.) when `as="a"` to preserve existing CTA behavior.
  - Added disabled/loading click guard for anchor mode.
**Supabase impact:** None.
**Tradeoffs:**
- `landing.css` still contains legacy navigation class rules that are now unused.
- `Card` base styles are now shared via design-system component rather than bespoke wrappers.
**Rollback:** Revert `app/page.tsx`, `components/ui/Button.tsx`, and this log entry.
**Next:** Remove dead landing-nav CSS rules after confirming no pages depend on them.
---

---
### 2026-02-24 — SEO phase 3.1 metadata + crawler access fixes
**Context:** Validation showed crawler endpoints were still behind auth redirects in production and route metadata from `head.tsx` was not reliably reflected as intended.
**Decision:** Move SEO metadata to Next.js metadata API (`metadata`/`generateMetadata`), harden public-route bypass in proxy auth logic, and extend robots disallow rules for private app paths.
**Changes:**
- Updated `proxy.ts` to centralize public crawler/marketing route bypass:
  - Public exact routes: `/`, `/pricing`, `/login`, `/robots.txt`, `/sitemap.xml`, `/example-packet.pdf`
  - Public prefixes: `/s/`, `/blog/`, `/use-cases/`, `/compare/`, `/templates/`
  - Kept auth redirect behavior for non-public routes.
- Updated `lib/seo.ts` with `buildPageMetadata(...)` utility for reusable route metadata objects (canonical, OG, Twitter, optional noindex).
- Reworked route metadata to use Next metadata API:
  - `app/layout.tsx` now provides root/home metadata via `buildPageMetadata(...)`
  - `app/pricing/page.tsx` exports `metadata`
  - `app/dashboard/page.tsx` exports `metadata` with noindex
  - `app/s/[token]/page.tsx` exports `generateMetadata` with noindex
  - Added `app/login/layout.tsx` metadata wrapper for client login page
- Removed legacy head-based SEO files:
  - deleted `app/head.tsx`
  - deleted `app/pricing/head.tsx`
  - deleted `app/login/head.tsx`
  - deleted `app/dashboard/head.tsx`
  - deleted `app/s/[token]/head.tsx`
  - deleted `app/components/SeoHead.tsx`
- Updated `app/robots.ts` disallow list to include `/app`.
- Local validation:
  - `next build` succeeds.
  - Raw HTML for `/` and `/pricing` now includes title, meta description, canonical, and OG tags.
  - `/`, `/pricing`, `/robots.txt`, `/sitemap.xml` return `200` unauthenticated locally.
**Supabase impact:** None.
**Tradeoffs:**
- Root metadata is defined at layout level (homepage defaults) and overridden on route pages where needed.
- Additional public route prefixes are allowlisted to keep future marketing expansions crawler-accessible.
**Rollback:** Revert changes in `proxy.ts`, `lib/seo.ts`, `app/layout.tsx`, `app/pricing/page.tsx`, `app/dashboard/page.tsx`, `app/s/[token]/page.tsx`, `app/login/layout.tsx`, `app/robots.ts`, and restore deleted `head.tsx` files if needed.
**Next:** Deploy and re-check production `robots.txt`/`sitemap.xml` for `200` responses and refreshed metadata output.
---

---
### 2026-02-24 — SEO phase 2 baseline implementation
**Context:** The SEO audit identified crawl/indexing gaps (missing sitemap/robots, duplicated metadata, no structured data, and weak server-visible fallback content on `/`).
**Decision:** Implement a low-risk SEO baseline using App Router-native `head.tsx`, JSON-LD helpers, dynamic sitemap/robots routes, and targeted marketing performance improvements without adding dependencies.
**Changes:**
- Added reusable SEO utilities in `lib/seo.ts` and a reusable head fragment in `app/components/SeoHead.tsx`.
- Added route-specific head files for canonical/title/description/OG/Twitter and noindex controls:
  - `app/head.tsx`
  - `app/pricing/head.tsx`
  - `app/login/head.tsx`
  - `app/dashboard/head.tsx`
  - `app/s/[token]/head.tsx`
- Added structured data helper `app/components/JsonLd.tsx`.
- Added SoftwareApplication JSON-LD and improved server-visible fallback/rendering strategy in `app/page.tsx`.
- Added FAQ + Breadcrumb JSON-LD and visible breadcrumb nav in `app/pricing/page.tsx`.
- Added Breadcrumb JSON-LD and visible breadcrumb nav in `app/login/page.tsx`.
- Added Breadcrumb JSON-LD in `app/s/[token]/page.tsx`.
- Improved marketing image handling on `app/page.tsx` by moving key landing images from `<img>` to `next/image` with `priority`/lazy loading.
- De-duplicated root metadata defaults in `app/layout.tsx`.
- Added dynamic sitemap and robots routes:
  - `app/sitemap.ts`
  - `app/robots.ts`
- Updated `proxy.ts` to explicitly allow `/robots.txt` and `/sitemap.xml`, and redirect authenticated login access to `/dashboard`.
- Added immutable cache header config for `/_next/static/*` in `next.config.ts`.
- Added implementation blueprint in `SEO_PHASE2_IMPLEMENTATION_PLAN.md`.
**Supabase impact:** None.
**Tradeoffs:**
- Root page remains client-driven for app logic, but now serves meaningful fallback HTML for crawlers while preserving current behavior.
- Robots currently disallows `/login` to reduce low-value indexation; adjust if login discoverability is desired.
**Rollback:** Revert the files listed above in one commit or `git checkout --` those paths and remove `SEO_PHASE2_IMPLEMENTATION_PLAN.md`.
**Next:** Consider splitting calculator UX off `/` into a protected route so marketing HTML and app JS are fully decoupled.
---

### 2026-01-30 — Theme Toggle in Footer
**Context:** The fixed toggle felt intrusive.
**Decision:** Move the theme toggle into a footer container at the bottom of the page.
**Changes:**
- Rendered the theme toggle inside a new footer in `app/layout.tsx`.
- Updated toggle styling in `app/globals.css` to be static and centered.
**Supabase impact:** None.
**Tradeoffs:**
- Toggle appears below page content rather than floating.
**Rollback:** Move `ThemeToggle` back to top-level and restore fixed styles in `app/globals.css`.
---
### 2026-01-30 — OS-Driven Theme Toggle
**Context:** Add OS-based theme switching with a manual toggle.
**Decision:** Use `prefers-color-scheme` when no user preference is stored and provide a fixed toggle UI for explicit overrides.
**Changes:**
- Added theme toggle client component in `app/components/ThemeToggle.tsx` and mounted it in `app/layout.tsx`.
- Added light-theme media override and toggle styling in `app/globals.css`.
- Removed default `data-theme` from `app/layout.tsx` so OS preference can drive the initial theme.
**Supabase impact:** None.
**Tradeoffs:**
- A fixed toggle is shown on all pages.
**Rollback:** Remove `ThemeToggle` and related CSS, and re-add `data-theme` on `app/layout.tsx`.
---
### 2026-01-30 — Add Light Theme Tokens
**Context:** Provide a light mode using the new token system.
**Decision:** Add a light theme token override and switch the app default to light.
**Changes:**
- Added `:root[data-theme="light"]` token overrides in `app/globals.css`.
- Replaced remaining hard-coded text colors in `app/globals.css`, `app/dashboard/dashboard.css`, and `app/login/login.css` with tokens.
- Set the default theme to light in `app/layout.tsx`.
**Supabase impact:** None.
**Tradeoffs:**
- Print styles remain hard-coded to preserve print fidelity.
**Rollback:** Remove the `data-theme` attribute in `app/layout.tsx` and revert token changes in `app/globals.css`.
---
### 2026-01-30 — Extract Shared CSS Utilities
**Context:** Reduce duplicated button/card/input styles after adding tokens.
**Decision:** Centralize shared styles in global utility groups and simplify page CSS.
**Changes:**
- Added shared utility selectors in `app/globals.css` for primary buttons, ghost buttons, surface cards, and inputs.
- Simplified overlapping styles in `app/globals.css`, `app/dashboard/dashboard.css`, and `app/login/login.css`.
**Supabase impact:** None.
**Tradeoffs:**
- Utilities are implemented as grouped selectors (no markup changes) for minimal diff.
**Rollback:** Revert changes in `app/globals.css`, `app/dashboard/dashboard.css`, and `app/login/login.css`.
**Next:** Optional: introduce semantic utility classes in markup as future cleanup.
---
### 2026-01-30 — Introduce Styling Tokens
**Context:** Make the existing visual system easier to maintain without redesigning components.
**Decision:** Add CSS variables for core colors/gradients/radii and refactor existing styles to use them.
**Changes:**
- Added design tokens in `app/globals.css` and swapped repeated color/gradient/radius values to variables.
- Updated `app/dashboard/dashboard.css` and `app/login/login.css` to use the shared tokens.
**Supabase impact:** None.
**Tradeoffs:**
- Some values remain hard-coded (print styles and a few legacy colors) to keep scope small.
**Rollback:** Revert changes in `app/globals.css`, `app/dashboard/dashboard.css`, and `app/login/login.css`.
**Next:** Optional: extract shared component classes (buttons/cards/forms) into reusable utilities.
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

---
### 2026-02-06 — Logged-out landing page
**Context:** Visitors were being sent straight to login; a sales landing page is needed for logged-out users while keeping the main app for logged-in users.
**Decision:** Allow public access to `/`, render the landing page when unauthenticated, and keep the calculator experience for signed-in users. Add a static example PDF for the CTA.
**Changes:**
- Updated auth routing in `proxy.ts` and post-login redirect in `app/login/page.tsx`.
- Added landing page UI and styles in `app/page.tsx` and `app/landing.css`.
- Added example packet asset in `public/example-packet.pdf` and linked it in the landing CTAs.
**Supabase impact:** None.
**Tradeoffs:**
- Landing is rendered after client auth check (brief loading state).
- Calculator stays at `/` for authenticated users while logged-out users see marketing content.
**Rollback:** Revert changes in `proxy.ts`, `app/page.tsx`, `app/landing.css`, `app/login/page.tsx`, and delete `public/example-packet.pdf`.
**Next:** Replace the placeholder example PDF with a real packet when ready.
---

---
### 2026-02-06 — Pricing page
**Context:** Need a pricing page with actual pricing tiers for the landing flow.
**Decision:** Create a dedicated `/pricing` route with pay-as-you-go, Pro ($299/mo), and Org (starting at $999/mo) tiers. Add public access via proxy.
**Changes:**
- Created `app/pricing/page.tsx` with 3-tier layout: Pay-as-you-go ($10/settlement or $49 for 10), Pro ($299/mo, featured), Org (starting at $999/mo).
- Created `app/pricing/pricing.css` with responsive pricing card styles, add-ons section, and FAQ section.
- Updated landing page in `app/page.tsx` to link "View pricing" CTA to `/pricing`.
- Updated `proxy.ts` to allow public access to `/pricing` route.
- Added back navigation button to return to landing page.
- Added add-ons section (onboarding/template setup $500, extra settlement packs $49 per 10).
**Supabase impact:** None.
**Tradeoffs:**
- Pro tier is marked "Most Popular" to drive conversions to monthly subscription.
- Pay-as-you-go allows users to start without monthly commitment.
**Rollback:** Delete `app/pricing/` directory, revert link change in `app/page.tsx`, revert `isPricingPage` additions in `proxy.ts`.
**Next:** Wire up actual Stripe checkout for each tier.
---

---
### 2026-02-06 — Landing page visual enhancements with 3-column card layouts
**Context:** Landing page was text-heavy and lacked visual interest. Needed icons, concert photography, and better visual hierarchy with card-based layouts.
**Decision:** Convert non-card sections to 3-column card layouts with centered titles. Add Lucide SVG icons and concert photography throughout. Each card displays icon, title, and description stacked vertically.
**Changes:**
- Restructured `app/page.tsx`:
  - Converted "Everything you need", "Three steps", and "Your data stays private" to 3-column card layouts
  - Each card has centered icon (32px), h3 title, and description
  - Steps section includes numbered badges (1/2/3) overlaying icons
  - Added 4 concert photos from Unsplash: hero background, 2 side panel images, final CTA background
  - Added photo attribution footer with credits for 4 photographers
- Updated `app/landing.css`:
  - Added `.landing-cards-grid` (3-column grid, stacks on mobile)
  - Added `.landing-feature-card` (centered vertical layout)
  - Added `.landing-step-badge` (gradient numbered badges)
  - Hero and CTA background images (12% and 8% opacity with blur)
  - Side-by-side panel layouts for image sections
  - Responsive breakpoints (single column on mobile)
  - Photo credits styling at page bottom
**Supabase impact:** None.
**Tradeoffs:**
- 3-column layouts improve scannability but use more vertical space on mobile
- 4 concert photos add ~600-800KB to page weight
- Icons inline as SVG (no external requests, adds ~2KB)
- Background images use very low opacity to maintain text readability
**Rollback:** Revert changes to `app/page.tsx` and `app/landing.css`; delete `public/concert-hero-*.jpg` files.
**Next:** Consider Next.js Image component for optimization and lazy loading.
---

---
### 2026-02-06 — Landing page navigation bar
**Context:** Landing page needed a navigation bar with logo and authentication CTAs for better user orientation and conversion.
**Decision:** Add a sticky top navigation bar with logo on left and Log in/Sign up buttons on right.
**Changes:**
- Updated `app/page.tsx`:
  - Added navigation bar component with GigSettle logo and name
  - Added Log in link and Sign up button (primary CTA)
  - Both link to `/login` page
  - Wrapped landing content in fragment to support nav + main layout
- Updated `app/landing.css`:
  - Added sticky navigation styles (`.landing-nav`) with backdrop blur
  - Logo + text layout with hover effects
  - Right-aligned action buttons with proper spacing
  - Sign up button uses primary gradient style
  - Responsive adjustments for mobile (smaller text, tighter spacing)
**Supabase impact:** None.
**Tradeoffs:**
- Sticky nav takes vertical space but improves navigation and conversion
- Backdrop blur effect may not work on older browsers (degrades gracefully)
**Rollback:** Revert changes to `app/page.tsx` and `app/landing.css` for navigation sections.
**Next:** Consider adding links to pricing page in navigation.
---

---
### 2026-02-24 — Server/client split for calculator page
**Context:** The calculator page (`/`) was a single `"use client"` component that performed auth and entitlement checks client-side, causing a visible loading delay (especially in the account dropdown) compared to the dashboard which uses server-side data fetching.
**Decision:** Refactor `app/page.tsx` into a server component that handles auth, entitlement, and subscription lookups on the server, then passes data as props to client components. This matches the dashboard's architecture.
**Changes:**
- Rewrote `app/page.tsx` as a server component:
  - Auth check via server Supabase client
  - Calls `getEntitlementDetails()` and `getUserSubscription()` server-side
  - Renders `LandingPage` (logged out), `CalculatorPaywall` (no access), or `CalculatorContent` (has access)
  - Passes `userId`, `userEmail`, and `accountMenuData` as props to client components
  - Added `metadata` export for SEO (was impossible as a client component)
- Created `app/calculator-content.tsx` (client component):
  - Receives server-fetched auth/account data as props (no more client-side auth fetch)
  - `AppAccountMenu` receives `initialData` prop — no API call needed, instant dropdown
  - Contains all interactive calculator logic (unchanged)
  - Inner `Suspense` wraps `useSearchParams` for show loading
- Created `app/calculator-paywall.tsx` (client component):
  - Paywall view extracted; receives pre-fetched account data as props
- Removed client-side entitlement imports (`hasProAccessClient`) from calculator flow
**Supabase impact:** None — same queries, just moved from client to server.
**Tradeoffs:**
- Calculator page is now server-rendered first (faster initial paint, no auth spinner)
- Account dropdown loads instantly on calculator, same as dashboard
- Two new files, but each has a single clear responsibility
**Rollback:** `git checkout HEAD~1 -- app/page.tsx && rm app/calculator-content.tsx app/calculator-paywall.tsx`
**Next:** The `/api/account` endpoint is now only used as a fallback (if `initialData` isn't provided). Consider removing it once all logged-in pages pass server data.
---

---
### 2026-02-24 — Global footer in AppShell
**Context:** The author bio footer (SectionFooter + AuthorCard) was hardcoded only on the calculator page. It should appear on all logged-in pages.
**Decision:** Move the footer into `AppShell` with a `showFooter` prop (default `true`) so every page wrapped in `AppShell` gets it automatically.
**Changes:**
- `components/ui/AppShell.tsx`: Added `showFooter` prop (default `true`), imported `SectionFooter` and `AuthorCard`, rendered them in place of the old empty `<footer>` element
- `app/calculator-content.tsx`: Removed `SectionFooter`/`AuthorCard` block and their imports
- `components/ui/AppShell.css`: Removed unused `.ds-app-footer` rule (footer now uses `SectionFooter`'s own styles)
**Supabase impact:** None.
**Tradeoffs:**
- Footer content is now centralized — one place to edit, shows on dashboard + calculator + any future logged-in pages
- Any page can opt out with `showFooter={false}`
**Rollback:** Revert `components/ui/AppShell.tsx`, `components/ui/AppShell.css`, and `app/calculator-content.tsx`.
---

---
### 2026-02-24 — Theme toggle in account dropdown
**Context:** User requested moving the dark/light mode toggle from the global page footer into the account dropdown.
**Decision:** Render ThemeToggle inside AppAccountMenu; remove it from root layout.
**Changes:**
- `components/ui/AppAccountMenu.tsx`: Import ThemeToggle, add a "Theme" block (label + ThemeToggle) in both loading and loaded states, above the actions (Manage Billing / Sign Out)
- `app/dashboard/dashboard.css`: Added `.dashboard-account-menu-theme` and `.dashboard-account-menu-theme-label` for spacing and label styling
- `app/layout.tsx`: Removed ThemeToggle import and the `<footer className="theme-toggle-footer">` block
- `app/globals.css`: Removed unused `.theme-toggle-footer` rule
**Supabase impact:** None.
**Tradeoffs:** Theme toggle is now only available on logged-in pages (inside account dropdown). Logged-out pages (landing, login, pricing) no longer show a theme control.
**Rollback:** Restore footer + ThemeToggle in layout; remove ThemeToggle from AppAccountMenu and revert dashboard.css/globals.css.
---

---
### 2026-02-24 — Theme label spacing + ThemeToggle in dsys
**Context:** "Theme" label was running into the toggle in the account dropdown; user also asked to componentize the toggle in the design system.
**Decision:** (1) Increase gap between label and toggle in account menu. (2) Move ThemeToggle into components/ui as a proper dsys component.
**Changes:**
- `app/dashboard/dashboard.css`: `.dashboard-account-menu-theme` gap 0.5rem → 0.75rem; label `display: block` for clarity
- `components/ui/ThemeToggle.tsx` + `ThemeToggle.css`: New dsys component (same behavior, classes `ds-theme-toggle` / `ds-theme-toggle-btn`)
- `app/globals.css`: Removed `.theme-toggle` and `.theme-toggle-btn` (moved to ThemeToggle.css)
- `components/ui/index.ts`: Export ThemeToggle and ThemeMode
- `components/ui/AppAccountMenu.tsx`: Import ThemeToggle from `./ThemeToggle` (dsys)
- Deleted `app/components/ThemeToggle.tsx`
- `app/design-system/page.tsx`: Added ThemeToggle section to preview
**Supabase impact:** None.
**Rollback:** Revert above files; restore app/components/ThemeToggle.tsx and globals theme styles.
---

---
### 2026-02-24 — Pricing page design system migration
**Context:** Migrate pricing page to use dsys components (MarketingShell/AppShell, Card, Button, Badge) per task #5.
**Decision:** Server-side auth; wrap in MarketingShell when logged out, AppShell when logged in. Replace tier cards with Card, CTAs with Button, "Most Popular" with Badge, addon blocks with Card. Document swaps and dead CSS in pricing.css.
**Changes:**
- `app/pricing/page.tsx`: Made async; added createClient().auth.getUser(), getEntitlementDetails, getUserSubscription; wrap content in MarketingShell (logged out) or AppShell with AppAccountMenu (logged in). Replaced tier divs with Card, .pricing-badge with Badge (variant="accent") inside .pricing-card-badge-wrap, all CTAs with Button (variant="primary"|"ghost"|"secondary"), addon divs with Card (variant="bordered"). Back link → Button + Icon chevron left.
- `app/pricing/pricing.css`: Added top comment block listing every component swap and dead/superseded CSS. Removed from .pricing-card: background, border, border-radius, padding. Removed .pricing-badge visual styles; added .pricing-card-badge-wrap for badge positioning. Reduced .pricing-cta to width: 100% only. Removed from .addon-item: background, border, border-radius, padding. Kept layout, typography, and .pricing-card-featured border override.
**Supabase impact:** None. Pricing logic and Stripe integration unchanged.
**Rollback:** Revert app/pricing/page.tsx and app/pricing/pricing.css.
---

---
### 2026-02-24 — CSS dead-class cleanup + token enforcement pass
**Context:** After migrating pages to dsys components, a final cleanup pass was requested to remove dead selectors, enforce token usage, and verify build status.
**Decision:** Remove only definitely-unused selectors from the requested page CSS files, enforce token-based color/radius/font-size usage, and expand the design-system page to represent newly used components.
**Changes:**
- `app/globals.css`:
  - Removed dead legacy selectors/rules (`.btn-primary`, `.btn-ghost`, `.save-show-btn*`, `.dashboard-link-btn*`, `.logout-btn*`, `.print-btn`, `.surface-card`, `.input-field`, `.container`, `.user-header*`, `.header*`, `.section`, `.section-title`, `.form-row`, `.calculate-btn*`, `.loading-state`, `.paywall`, `.paywall-features`, `.paywall-feature*`, `.paywall-btn*`, `.save-status-message*`, `.footer-section*`, `.footer-content`, `.footer-photo`, `.footer-text*`, `.footer-email*`, `.footer-cheers`, `.calculator-footer-section`).
  - Added `--color-on-primary`, `--radius-full`, and print palette variables (`--color-print-*`), then replaced hardcoded print hex values with variable references.
  - Converted `.share-link-status-dot` radius to `var(--radius-full)`.
- `app/landing.css`:
  - Removed dead nav/legacy selectors (`.landing-nav*`) and unused blocks (`.landing-security*`, `.landing-steps*`, `.landing-step-icon`), plus related mobile/media overrides.
  - Converted `.landing-step-number` radius to `var(--radius-full)`.
- `app/dashboard/dashboard.css`:
  - Removed dead selectors (`.dashboard-intro`, `.subscription-status*`, `.status-badge`, `.status-description`, `.cancel-notice`, `.dashboard-top-header`, `.dashboard-title-section*`, `.dashboard-footer*`, `.subscription-info-compact`, `.action-btn.primary:hover`).
  - Replaced raw `font-size: 2rem` with tokenized `var(--text-3xl)`.
- `app/pricing/pricing.css`: Replaced badge text color `#fff` with `var(--color-on-primary)`.
- `components/ui/Button.css`, `ThemeToggle.css`, `SegmentedControl.css`, `Badge.css`, `AuthorCard.css`:
  - Replaced hardcoded `#fff` with `var(--color-on-primary)`.
  - Replaced `50%`/`999px` radii with `var(--radius-full)`.
- `app/design-system/page.tsx`:
  - Added sticky top-right floating `ThemeToggle`.
  - Added demos for `SegmentedControl`, `DescriptionList`, and `BreakdownList`.
**Supabase impact:** None.
**Tradeoffs:**
- Print palette now routes through variables for consistency and policy compliance.
- Some removed legacy selectors may no longer be available for ad-hoc experiments outside current TSX usage.
**Rollback:** Revert this commit’s touched CSS files plus `app/design-system/page.tsx` and this Project_History entry.
---

---
### 2026-02-25 — Settlement flow audit & roadmap
**Context:** Reviewed the entire settlement calculator from the perspective of a venue accountant / tour manager to identify gaps, dispute risks, and missing real-world scenarios.
**Decision:** Captured findings in two new docs rather than code changes.
**Changes:**
- Added `docs/SETTLEMENT_AUDIT.md` — full audit of missing line items, edge cases, dispute-prone areas, reconciliation risks, and unsupported scenarios.
- Added `docs/SETTLEMENT_ROADMAP.md` — 11-phase buildable roadmap (itemized expenses → multi-act support → notes/countersignature), plus a future-considerations backlog.
**Supabase impact:** None.
**Tradeoffs:**
- Roadmap phases are ordered by dispute-reduction impact, not feature flashiness.
- Some later phases (multi-act, withholding) may need schema changes when we get there.
**Rollback:** Delete `docs/SETTLEMENT_AUDIT.md` and `docs/SETTLEMENT_ROADMAP.md`, remove this entry.
---

---
### 2026-02-25 — Phase 1: Itemized expenses
**Context:** Single totalExpenses field was the #1 dispute source. Replaced with repeatable line-item expenses per the settlement roadmap.
**Decision:** Add ExpenseItem type, repeatable UI rows (composed from existing Input + Button), itemized display in calculator summary and shared view.
**Changes:**
- `app/calculator-content.tsx`: Added ExpenseItem type, COMMON_EXPENSES datalist, expense add/remove/update functions, updated FormData, CalculationResult, handleCalculate, handleSaveShow, loadShow, form UI, and results UI.
- `app/calculator.css`: Added .calculator-expense-list, .calculator-expense-row, .calculator-expense-remove, .expense-subtotal styles with mobile responsive grid.
- `app/s/[token]/page.tsx`: Updated Show interface for expenseItems in inputs and results, updated Show Details and Settlement Breakdown sections to render itemized expenses.
**Supabase impact:** None (inputs/results JSONB columns now include expenseItems array alongside existing totalExpenses for backward compat).
**Tradeoffs:**
- Old shows without expenseItems load as a single "Other Expenses" row — no data loss.
- totalExpenses is still saved in inputs for any external consumers reading the JSONB directly.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/calculator.css app/s/\[token\]/page.tsx`
---

---
### 2026-02-25 — Phase 2: Multiple ticket tiers
**Context:** Single ticketPrice × ticketsSold was inaccurate for any show with more than one price point (GA, VIP, etc.).
**Decision:** Replace single ticket fields with repeatable ticket tier rows (name, price, sold, comps) + optional venue capacity. Same compose-from-existing-components pattern as Phase 1.
**Changes:**
- `app/calculator-content.tsx`: Added TicketTier type, replaced ticketPrice/ticketsSold in FormData with ticketTiers array + capacity field. Added addTicketTier/removeTicketTier/updateTicketTier functions. Updated handleCalculate to sum revenue across tiers. Updated form UI with repeatable tier rows. Updated results to show per-tier breakdown with subtotal. Updated save/load with backward compat (old shows load as single "General Admission" tier).
- `app/calculator.css`: Added .calculator-tier-list, .calculator-tier-row (5-col grid: 2fr name, 1fr price, 1fr sold, 1fr comps, auto remove), .tier-subtotal styles. Mobile breakpoint at 600px collapses to 2-col with name spanning full width.
- `app/s/[token]/page.tsx`: Updated Show interface for ticketTiers/capacity in inputs and results. Show Details renders per-tier info when multiple tiers exist. Breakdown shows per-tier revenue rows with sold×price labels and a gross revenue subtotal.
**Supabase impact:** None (inputs/results JSONB now includes ticketTiers array alongside existing ticketPrice/ticketsSold for backward compat).
**Tradeoffs:**
- Old shows without ticketTiers load as single "General Admission" tier — no data loss.
- ticketPrice and ticketsSold still saved for legacy readers.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/calculator.css app/s/\[token\]/page.tsx`
---

---
### 2026-02-25 — Phase 3: Deposit / advance & balance due
**Context:** Guarantees are rarely paid in full at settlement. Tour managers need to see "balance due tonight" after subtracting the deposit already wired.
**Decision:** Add deposit field to form and surface Balance Due at Settlement (or Overpayment warning when deposit > artist payout).
**Changes:**
- `app/calculator-content.tsx`: Added `deposit` to FormData, `deposit` + `balanceDue` to CalculationResult. Added deposit Input field after Deal Structure. handleCalculate computes balanceDue = artistPayout - deposit. Results show "Deposit Paid" and "Balance Due at Settlement" rows when deposit > 0, with overpayment label when negative. Updated save/load.
- `app/calculator.css`: Added .balance-due (success colors) and .overpayment (error colors) result row styles.
- `app/s/[token]/page.tsx`: Updated Show interface for deposit in inputs and results. Deal Structure section shows deposit when present. Breakdown shows Deposit Paid and Balance Due rows with appropriate variants.
**Supabase impact:** None.
**Tradeoffs:**
- Old shows without deposit load with empty deposit field — no data loss, no visual change.
- Overpayment scenario uses error coloring to make it unmissable.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/calculator.css app/s/\[token\]/page.tsx`
---

---
### 2026-02-25 — Phase 4: Guarantee + back-end overage deal type
**Context:** "Guarantee plus a percentage of net after a breakeven point" is the most common mid-level touring deal structure and was not supported.
**Decision:** Add `guarantee_plus_percentage` deal type with optional breakeven field (defaults to guarantee + expenses).
**Changes:**
- `app/calculator-content.tsx`: Added `guarantee_plus_percentage` to DealType union. Added `breakeven` to FormData, `overage` + `breakeven` to CalculationResult. Calculation: `artistPayout = guarantee + Math.max(0, (netProfit - breakeven) * (percentage / 100))`. Breakeven defaults to guarantee + totalExpenses when left blank. New Select option, conditional breakeven Input with hint. Results show Guarantee, Breakeven Point, and Back-End Overage rows before the total Artist Payout. Updated save/load.
- `app/s/[token]/page.tsx`: Updated Show interface, formatDealType, Deal Structure section (shows breakeven and "Back-End Percentage" label), Breakdown section (shows guarantee/breakeven/overage rows when present).
**Supabase impact:** None.
**Tradeoffs:**
- Breakeven auto-calculation (guarantee + expenses) covers the standard case; explicit override available for custom deals.
- Overage rows only render when deal type includes them, so existing settlements are unchanged.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx`
---

---
### 2026-02-25 — Phase 5: Door deal & percentage of gross
**Context:** Current "Percentage of Net" deducts both tax and expenses before the split. Real-world deals include percentage of gross (no deductions) and door deals (only tax deducted).
**Decision:** Add two new deal types to cover the remaining percentage-based structures.
**Changes:**
- `app/calculator-content.tsx`: Added `percentage_of_gross` and `door_deal` to DealType. percentage_of_gross: `artistPayout = grossRevenue * (percentage / 100)`. door_deal: `artistPayout = (grossRevenue - taxAmount) * (percentage / 100)`. Added Select options with clear labels. Percentage field shown for both. Artist Payout label in results clarifies the basis (e.g., "80% of Gross After Tax"). Consolidated validation for all percentage-only deal types.
- `app/s/[token]/page.tsx`: Added formatDealType cases. Breakdown labels show the calculation basis for new deal types.
**Supabase impact:** None.
**Tradeoffs:**
- No new form fields needed — both types only require the percentage field.
- Labels explicitly state what is deducted before the split to prevent confusion.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx`

---
### 2026-02-25 — Export to CSV
**Context:** Users needed a way to export settlement data for bookkeeping, email, or import into accounting software.
**Decision:** Add a client-side CSV export that mirrors the settlement summary layout.
**Changes:**
- `app/calculator-content.tsx`: Added `handleExportCSV()` function that builds two-column CSV (line item, amount) matching the results waterfall. Triggered from a ghost Button in the PageHeader, visible when results exist. File named after the show (e.g., `Summer-Festival-2026-settlement.csv`).
**Supabase impact:** None.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx`

---
### 2026-02-25 — Phase 6: Calculation Integrity
**Context:** Currency calculations used raw floating-point math, leading to potential rounding artifacts. No mechanism to detect or prevent stale results. Venue loss scenarios were not flagged.
**Decision:** Extract calculation into a pure function with rounding at every step. Add stale-result tracking, warnings for non-numeric input, recalculation on save, `calculatedAt` timestamp, and venue loss UI.
**Changes:**
- `app/calculator-content.tsx`: Added `round2()` helper applied to every currency calculation step. Added `warnIfNotNumeric()` to flag fields with non-numeric text that silently fall back to 0. Extracted all calculation logic into pure `computeSettlement(FormData) → ComputeOutput` function (returns result + warnings, or error). `handleCalculate` now delegates to `computeSettlement`, sets warnings and stale state. `handleSaveShow` recalculates from current inputs before saving (guarantees stored results match stored inputs). Added `calculatedAt` ISO timestamp to `CalculationResult`. Added `resultsStale` state that gets set when any input changes after calculation; shows amber banner. Added `warnings` state displayed at top of results card. Venue payout row dynamically styled as "Venue Loss" (error theme) when negative. CSV export updated for venue loss label.
- `app/s/[token]/page.tsx`: Added `calculatedAt` to Show type. Footer shows "Calculated [datetime]" when available. Venue payout row shows "Venue Loss" label when negative.
- `app/calculator.css`: Added styles for `.venue-loss`, `.calculator-stale-banner`, `.calculator-warnings`.
**Supabase impact:** None (calculatedAt stored in existing results JSONB; old shows without it render fine).
**Tradeoffs:**
- Chose "invalidate + banner" over auto-recalculate to avoid constant re-computation on keystroke.
- Recalculation on save means even if displayed results are stale, the saved data is always consistent.
- `computeSettlement` is a pure module-level function, making it straightforward to unit test in the future.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx app/calculator.css`

---
### 2026-02-25 — Phase 7: Credit Card Fees & Tax Refinement
**Context:** CC processing fees (typically 2.9%) were invisible in settlements, and the tax calculation assumed prices always excluded tax.
**Decision:** Add CC fee rate with a mode toggle (off-the-top vs. venue expense), and a tax-inclusive pricing toggle. Split the "Tax & Expenses" form section into "Tax & Fees" and "Show Expenses" for clarity.
**Changes:**
- `app/calculator-content.tsx`: Added `taxMode` ("exclusive"/"inclusive"), `ccFeeRate`, `ccFeeMode` ("expense"/"off_top") to FormData. Added `ccFees` to CalculationResult. In `computeSettlement`: tax-inclusive mode uses `grossRevenue * taxRate / (100 + taxRate)` to back-calculate tax from included prices. CC fees calculated as `grossRevenue * (ccFeeRate / 100)`. "Off the top" mode deducts CC from net (shared cost); "expense" mode deducts from venue payout only (artist split unaffected). Form UI split into two subsections with Select dropdowns for tax mode and CC mode, each with descriptive option labels. Results waterfall shows CC fees after tax (off_top) or after artist payout (expense) with clear labels. CSV export and shared view both updated with CC fees rows and improved tax labels. loadShow backward-compatible (defaults: exclusive tax, no CC fee, expense mode).
- `app/s/[token]/page.tsx`: Added `taxMode`, `ccFeeRate`, `ccFeeMode` to Show inputs type and `ccFees` to results type. Show Details displays tax mode and CC fee info. Breakdown shows CC fees in correct waterfall position based on mode.
**Supabase impact:** None (new fields stored in existing inputs/results JSONB).
**Tradeoffs:**
- "Off the top" CC fees reduce the net pool for both parties; "expense" mode preserves the artist's split and puts the CC burden on the venue — matches common real-world contractual variations.
- Tax-inclusive mode uses the standard back-calculation formula, so the displayed tax amount is lower than exclusive mode for the same rate (as expected).
- Used Select dropdowns (existing component) rather than custom toggles for the mode switches.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx`

---
### 2026-02-25 — Phase 8: Merch Settlement
**Context:** Merch revenue and venue merch cuts are a standard part of live show settlements but were completely missing from the calculator. Artists need to know their total payout across both show and merch.
**Decision:** Add a merch section to the form and display merch settlement as a clearly separated section in the results (not mixed into the show waterfall). Include a "Total Due to Artist" line that combines show balance due + net merch.
**Changes:**
- `app/calculator-content.tsx`: Added `merchGross` and `merchVenuePercent` to FormData. Added `merchGross`, `merchVenueCut`, `merchNetToArtist`, `totalDueToArtist` to CalculationResult. In `computeSettlement`: venue merch cut calculated as `merchGross * (merchVenuePercent / 100)`, net merch is `merchGross - venueCut`, totalDueToArtist is `balanceDue + merchNetToArtist` (only when merch exists). Form has new "Merch (optional)" section with two fields in a row layout. Results display shows merch settlement as a distinct subsection (Gross Sales → Venue Cut → Net to Artist), followed by a "Total" subsection combining show + merch. CSV export includes merch rows. loadShow backward-compatible (defaults to empty strings).
- `app/s/[token]/page.tsx`: Added merch fields to Show types. Shared view renders "Merch Settlement" and "Total" as separate BreakdownList sections when merch data exists.
**Supabase impact:** None (new fields stored in existing inputs/results JSONB).
**Tradeoffs:**
- Merch section is separate from the show waterfall to prevent confusion about what affects the artist's performance split vs. merch split.
- Venue merch percentage defaults to empty (not 20%) to avoid assumptions — every deal is different.
- totalDueToArtist only shown when merch exists; without merch, the existing balance due / artist payout lines are sufficient.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx`

---
### 2026-02-25 — Phase 9: Withholding Tax & Buyouts
**Context:** Non-resident artists often face state withholding tax (e.g., CA 7%, NY 8.82%). Rider buyouts (catering, hotel, production) are standard in touring contracts but had no place in the settlement.
**Decision:** Add withholding rate + state label fields. Add repeatable buyout items with a mode toggle: "deduct from balance" (venue provided, deducted from artist cash) or "show expense" (reduces net profit for everyone).
**Changes:**
- `app/calculator-content.tsx`: Added `BuyoutItem` interface and `COMMON_BUYOUTS` suggestions. Added `withholdingRate`, `withholdingState`, `buyoutItems`, `buyoutMode` to FormData. Added `withholdingAmount`, `withholdingState`, `buyoutItems`, `totalBuyouts` to CalculationResult. In `computeSettlement`: buyouts parsed like expense items. "show_expense" mode adds buyout total to expenses before net calc. Withholding calculated as `artistPayout * (withholdingRate / 100)`. balanceDue now accounts for deposit + withholding + buyout deductions. Form has "Withholding & Buyouts" section with rate/state fields, repeatable buyout rows with datalist, and mode select. Results display shows withholding and buyouts (deduct mode) between Artist Payout and Balance Due. Buyouts (expense mode) appear in the expenses waterfall section. Balance Due section now shown whenever any deductions exist (not just deposit). CSV export includes withholding and buyout rows in correct positions.
- `app/s/[token]/page.tsx`: Added withholding and buyout fields to Show types. Deal Structure section shows withholding rate/state and buyout handling mode. Breakdown shows withholding and buyout rows in correct waterfall positions based on mode.
**Supabase impact:** None (new fields stored in existing inputs/results JSONB).
**Tradeoffs:**
- "Deduct from balance" is the most common real-world handling (venue provides the item, deducts cost from artist cash payout).
- "Show expense" mode is for contracts where buyouts reduce the available pool before splits — affects percentage-based deals.
- Buyout items start with one empty row to signal the feature exists, same pattern as expenses.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx`
---

## Phase 10 — Multi-Act Support
**Date:** 2026-02-25
**Context:** Allow multiple artists on a single show, each with their own independent deal structure, settling against the same gross/net pool.
**Key decisions:**
- Artist-specific fields (name, deal type, guarantee, percentage, breakeven, deposit, withholding, buyouts) moved into a repeatable `ArtistDeal` array inside FormData.
- Each artist computes independently against the shared net profit. The venue absorbs whatever remains after all artist payouts.
- Extracted `computeArtistDealPayout()` as a pure helper to avoid duplicating switch/case logic per artist.
- Per-artist buyouts in "show expense" mode are collected and added to total expenses before net calculation, affecting all artists' percentage-based deals.
- Legacy single-artist fields kept in saved inputs for backward compatibility with older shared views.
- `totalDueToArtist` (merch combined total) only shown for single-artist shows to avoid ambiguity.
**Changes:**
- `app/calculator-content.tsx`: Added `ArtistDeal`, `ArtistCalcResult` interfaces. Replaced flat deal fields in FormData with `artists: ArtistDeal[]`. Added `artists: ArtistCalcResult[]` to CalculationResult. Extracted `computeArtistDealPayout()` helper. Refactored `computeSettlement()` to loop over artists array. Added `artistIdCounter` ref and handler functions (`addArtist`, `removeArtist`, `updateArtistField`, `addArtistBuyoutItem`, `removeArtistBuyoutItem`, `updateArtistBuyoutItem`). Updated `loadShow` with backward compat (flat → artists array conversion). Updated `handleSaveShow` to serialize artists array plus legacy compat fields. Form UI now renders per-artist sections with deal params, withholding, and buyouts inside bordered cards with "+ Add Another Artist" button. Results display shows per-artist payout breakdowns with separate sections for multi-act, plus "Total Artist Payouts" summary row. CSV export outputs per-artist blocks with separator rows.
- `app/s/[token]/page.tsx`: Added `ArtistInput`, `ArtistResultEntry` interfaces to Show type. Deal Structure section renders per-artist when multiple artists exist. Settlement Breakdown handles per-artist payout sections with dividers, falling back to legacy single-artist format for old data.
- `app/calculator.css`: Added styles for `.calculator-artist-section`, `.calculator-subsection-title`, and `.calculator-artist-result-block`.
**Supabase impact:** None (artists array stored in existing inputs/results JSONB).
**Tradeoffs:**
- Each artist's percentage deal is calculated against the full net (not reduced by other artists' payouts). The venue takes the risk if total payouts exceed net.
- Buyout mode is per-artist: one artist can have buyouts as expenses while another has them deducted from balance.
- Single-artist shows work identically to before (one-element artists array with same UX).
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/s/\[token\]/page.tsx app/calculator.css`
---

## Phase 11 — Notes, Annotations & Countersignature
**Date:** 2026-02-25
**Context:** Let both parties document disputes and acknowledge the settlement — the final feature phase of the roadmap.
**Key decisions:**
- General notes stored as `notes` string in FormData/inputs/results. Textarea uses existing `.ds-input` classes (no new component needed).
- Per-expense notes stored as optional `note` field on each ExpenseItem. Displayed inline in results and shared view.
- Acknowledgments stored in `results.acknowledgments` JSONB array (avoids schema changes). Server action appends via service client.
- Calculator save preserves existing acknowledgments when updating (reads from current result state).
- No authentication required for acknowledging — anyone with the share link can do it (link-based access).
- Dashboard shows most recent acknowledgment as a Badge on each show card.
**Changes:**
- `app/calculator-content.tsx`: Added `note?: string` to ExpenseItem interface. Added `notes: string` to FormData. Added `Acknowledgment` interface and `acknowledgments?: Acknowledgment[]` to CalculationResult. Updated `computeSettlement` to pass through notes and expense notes. Updated `updateExpenseItem` to accept "note" field. Form UI has per-expense note sub-rows (visible when expense has content) and a general "Notes" textarea. Results display shows notes block, per-line-item note annotations, and acknowledgment entries. CSV export includes notes and expense annotations. `handleSaveShow` persists notes and preserves existing acknowledgments on re-save.
- `app/s/[token]/page.tsx`: Added `notes`, `acknowledgments`, and expense `note` fields to Show interface. Notes section rendered between Show Info and Deal Structure. Expense items in both Show Details and Settlement Breakdown include note annotations. AcknowledgeForm client component rendered before the footer.
- `app/s/[token]/actions.ts`: New server action `acknowledgeSettlement(token, name, email)` — validates inputs, looks up show via share token, appends acknowledgment to results JSONB.
- `app/s/[token]/AcknowledgeForm.tsx`: New client component with name/email form. Uses `useTransition` for pending state. Displays existing acknowledgments and allows new ones.
- `app/s/[token]/shared-settlement.css`: Styles for notes, acknowledgment section, form fields, success/error messages. Print styles hide the form.
- `app/calculator.css`: Styles for expense notes, general notes textarea, inline note annotations, and acknowledgment display in results.
- `app/dashboard/page.tsx`: Added `Badge` import. Updated select to include `results`. Show cards display multi-artist names from artists array. Acknowledgment status shown as a success Badge with most recent acknowledger name and date.
**Supabase impact:** None (notes and acknowledgments stored in existing inputs/results JSONB).
**Tradeoffs:**
- Acknowledgments in results JSONB means they could theoretically be lost if someone manually edits the results column, but the save flow preserves them.
- Per-expense notes only appear when the expense row has content (label or amount), keeping the form clean for empty rows.
- No authentication for acknowledging — deliberate choice matching the roadmap's "link-based access" requirement.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/calculator.css app/s/\[token\]/page.tsx app/s/\[token\]/shared-settlement.css app/s/\[token\]/actions.ts app/s/\[token\]/AcknowledgeForm.tsx app/dashboard/page.tsx`
---

---
### 2026-02-25 — Usability Hardening (Roadmap Part 4)
**Context:** The usability audit identified high-risk settlement workflow issues for late-night, high-pressure usage (stale outputs, ambiguous labels, weak safeguards, and DS inconsistency).
**Decision:** Prioritize risk reduction and clarity improvements first, while refactoring toward existing design-system components instead of introducing new visual styles.
**Changes:**
- `app/calculator-content.tsx`: Added unsaved-change safeguards (`beforeunload` + guarded dashboard navigation), confirmation prompts for destructive row removals (tiers, expenses, artists, buyouts), non-negative numeric sanitization, percentage caps, keyboard shortcut for calculation (`Ctrl/Cmd + Enter`), live pre-calc warnings for ticket/capacity mismatches, stronger stale-results warning placement, clearer settlement microcopy (tax/card-fee/buyout labels), visible deal-type helper text, and consistent top summary label (`Amount due tonight`). Save action now stays enabled whenever results exist (except while saving), and save button copy now reflects settlement terminology.
- `app/components/SharePopover.tsx`: Removed duplicate icon-only quick-copy control and blocking confirm flow, keeping a single clear Share entry point via popover.
- `app/components/ShareLinkManager.tsx`: Refactored raw controls to existing design-system `Button` and `Input` components, improved sharing copy, added stale-results warning in share panel, and standardized loading/disabled interaction states.
- `app/calculator.css`: Added styles for prominent stale banner, sticky calculate action, deal helper text spacing, and replaced undefined token usage with existing DS tokens.
- `app/s/[token]/shared-settlement.css`, `app/dashboard/DashboardToast.css`: Replaced undefined color-token usage with existing DS token equivalents.
- `components/ui/Popover.css`: Added focus-visible affordance using `:focus-within` for better keyboard focus clarity on popover triggers.
- `app/login/login.css`, `app/dashboard/dashboard.css`: Standardized primary hover lift to align with DS interaction feel.
**Supabase impact:** None.
**Tradeoffs:**
- Destructive-action confirmations currently use native confirm dialogs for speed and low implementation risk; custom in-app confirmations can replace these later.
- Numeric sanitization now blocks negative entry at input-time; stricter field-by-field validation rules can be layered in future without schema changes.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/components/SharePopover.tsx app/components/ShareLinkManager.tsx app/calculator.css app/s/\[token\]/shared-settlement.css app/dashboard/DashboardToast.css components/ui/Popover.css app/login/login.css app/dashboard/dashboard.css Project_History.md`
---

---
### 2026-02-25 — Roadmap Completion (No-DB Pass)
**Context:** Complete the remaining roadmap items while keeping rollback simple and explicitly avoiding schema migrations, RLS edits, or other persistent infrastructure changes.
**Decision:** Implement only app-layer and style-layer improvements that remain one-commit reversible, including draft-save behavior and share-before-save UX via existing APIs.
**Changes:**
- `app/api/shows/save/route.ts`: Added `allowDraft` support. Save now permits draft writes when calculation fails, while preserving existing finalized `results` on update by omitting `results` updates for draft saves.
- `app/calculator-content.tsx`: Added draft-capable save flow (`Save Draft` fallback), return value from save handler (show id), and new `Save & Copy Share Link` action for unsaved-but-calculated settlements (share-before-save without DB changes). Migrated core settlement waterfall sections to `BreakdownList` for design-system alignment (gross/tax/expenses/net + venue + merch/total blocks). Updated save copy to settlement-focused language.
- `app/dashboard/page.tsx` + `app/dashboard/dashboard.css`: Removed duplicate custom create-button styling usage in favor of `Button` size variants and simplified responsive button targeting.
- `app/login/page.tsx` + `app/login/login.css`: Removed custom submit-button style dependency by using DS `Button` sizing/block behavior and replaced legacy `form-group` spacing with local layout spacing (`auth-form-fields`).
- `app/globals.css`: Removed obsolete share-button/toggle/input style blocks and redundant global gradient button utility overrides that duplicated design-system button behavior.
- `app/landing.css`: Replaced hero heading `clamp(...)` with DS typography tokens and aligned off-scale spacing values.
- `app/calculator.css`: Added minor support class for post-migration `BreakdownList` spacing.
**Supabase impact:** None (no schema migrations, no policy/RLS changes, no table alterations).
**Tradeoffs:**
- Draft saves intentionally do not generate share links by themselves; sharing still requires a calculable settlement path (now enabled through save-and-share once results are valid).
- Calculator results migration is focused on the highest-signal summary waterfall first; per-artist block styling remains partially hybrid to minimize risk in one pass.
**Rollback:** `git checkout HEAD -- app/api/shows/save/route.ts app/calculator-content.tsx app/calculator.css app/dashboard/page.tsx app/dashboard/dashboard.css app/login/page.tsx app/login/login.css app/globals.css app/landing.css Project_History.md`
---

---
### 2026-02-25 — Prevent Number Input Scroll Changes
**Context:** Numeric fields (e.g., venue capacity) changed values when users scrolled with focus still inside the input, creating accidental financial edits.
**Decision:** Apply a shared input-level safeguard so number inputs stop wheel-driven value stepping by blurring on wheel interaction.
**Changes:**
- `components/ui/Input.tsx`: Added centralized `onWheel` handling to `Input`:
  - Preserves custom caller `onWheel` behavior.
  - For `type="number"`, blurs the focused input on wheel to prevent unintended increment/decrement.
**Supabase impact:** None.
**Tradeoffs:**
- Users can still adjust number values manually (typing/arrow keys); only wheel-based accidental changes are suppressed.
**Rollback:** `git checkout HEAD -- components/ui/Input.tsx Project_History.md`
---

---
### 2026-02-25 — Optional Roadmap Polish (DS Completion Pass)
**Context:** Final optional roadmap items remained after the no-DB implementation pass: per-artist results consistency, native dialog removal, textarea component parity, and residual legacy CSS debt.
**Decision:** Complete these as UI-layer refactors only, using existing DS primitives and no backend/schema changes.
**Changes:**
- `components/ui/Textarea.tsx` + `components/ui/Textarea.css` + `components/ui/index.ts`: Added a first-class DS `Textarea` with label/error/hint/size variants and exported it through the DS index.
- `app/calculator-content.tsx`: Replaced native destructive `window.confirm()` flows with in-app DS confirmation banners for both row removals and unsaved-leave navigation. Migrated per-artist results rows (deal breakdown, payouts, deductions, balance due) to `BreakdownList` for consistency. Replaced the top "Amount due tonight" callout with `BreakdownList`. Swapped the general notes field to DS `Textarea`, and per-expense note input to DS `Input`.
- `app/calculator.css`: Removed obsolete `calculator-result-row` style variants no longer used after `BreakdownList` migration; added DS-styled confirmation banner styles; updated note and textarea selectors to target DS wrappers/components.
- `app/globals.css`: Removed dead legacy `.form-group` and `.result-row` style blocks (including related print-only variants) now unused by active markup.
**Supabase impact:** None (no migrations, no policy/RLS changes, no schema updates).
**Tradeoffs:**
- In-app confirmation is a two-step inline banner rather than modal/undo queue, favoring lower implementation risk and clear rollback.
- Print styling now relies on DS component print behavior rather than legacy `.result-row` selectors.
**Rollback:** `git checkout HEAD -- components/ui/Textarea.tsx components/ui/Textarea.css components/ui/index.ts app/calculator-content.tsx app/calculator.css app/globals.css Project_History.md`
---

---
### 2026-02-25 — Settlement Hardening Integrity Pass
**Context:** Final cleanup/confirmation phase for money-sensitive settlement workflows required stronger server-side input hardening and accessibility consistency checks.
**Decision:** Tighten numeric parsing/clamping in shared calculation logic and enforce robust IDs/labels in DS form primitives, while keeping changes local and rollback-safe.
**Changes:**
- `lib/settlement/calculate.ts`: Hardened numeric parsing to finite-only values; added server-side non-negative and percent clamping (`parseNonNegative`, `parsePercent`) with explicit warnings; applied clamping to tax/fee rates, ticket counts/comps, expenses, buyouts, artist guarantees/percentages/breakeven/deposit/withholding, and merch inputs.
- `components/ui/Input.tsx`, `components/ui/Select.tsx`, `components/ui/Textarea.tsx`: Added `useId` fallback IDs when no explicit id/label-derived id is available, preventing undefined/duplicate `aria-describedby` targets in dynamic rows.
- `components/ui/BreakdownList.tsx`: Added `role="list"` to the container to pair with row `role="listitem"` semantics.
- `app/calculator-content.tsx`: Added explicit `aria-label` attributes for repeated dynamic ticket/expense/buyout/note inputs where visible labels are intentionally shown only on the first row.
**Supabase impact:** None (no schema, RLS, or env changes).
**Tradeoffs:**
- Clamping/canonicalization may adjust malformed API payload values instead of preserving them verbatim, but this is intentional for financial safety.
- Repo-wide lint still has pre-existing unrelated issues outside settlement scope.
**Rollback:** `git checkout HEAD -- lib/settlement/calculate.ts components/ui/Input.tsx components/ui/Select.tsx components/ui/Textarea.tsx components/ui/BreakdownList.tsx app/calculator-content.tsx Project_History.md`
---

---
### 2026-02-25 — Contextual Removal Confirmation Popovers
**Context:** Inline confirmation banners for destructive row actions rendered near the top of the page, making them easy to miss when users remove artists/tiers/expenses lower in the form.
**Decision:** Move destructive confirms to contextual, trigger-anchored DS popovers so confirmation appears adjacent to the clicked remove action.
**Changes:**
- `app/calculator-content.tsx`: Replaced global pending-removal banner flow with reusable `DestructiveConfirmPopover` (using existing `Popover` + `Button` components) for tier, expense, artist, and buyout remove actions.
- `app/calculator.css`: Added local popover copy/action spacing styles and artist-remove alignment utility.
**Supabase impact:** None.
**Tradeoffs:**
- Confirmation UI is now per-control and requires one extra click in-context rather than relying on a global message area.
**Rollback:** `git checkout HEAD -- app/calculator-content.tsx app/calculator.css Project_History.md`
---
