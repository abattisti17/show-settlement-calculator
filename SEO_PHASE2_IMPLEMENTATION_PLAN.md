# SEO Phase 2 Implementation Plan

This plan is specific to this Next.js App Router codebase.

## P0 - Rendering/Indexing

- Keep the public homepage crawlable by rendering meaningful HTML in the root Suspense fallback.
- File: `app/page.tsx`
  - `Suspense` fallback now renders `LandingPage` content instead of a loading shell.

## P1 - Meta tags + reusable SEO component

- Reusable head component:
  - `app/components/SeoHead.tsx`
  - Props: `title`, `description`, `path`, optional `ogImage`, optional `noIndex`.
- URL helpers:
  - `lib/seo.ts`
  - `toAbsoluteUrl()` used by canonicals/OG/sitemap/robots.
- Route head files:
  - `app/head.tsx` (homepage metadata)
  - `app/pricing/head.tsx`
  - `app/login/head.tsx` (`noindex`)
  - `app/dashboard/head.tsx` (`noindex`)
  - `app/s/[token]/head.tsx` (`noindex`)
- Layout metadata de-duplicated:
  - `app/layout.tsx` now keeps only `metadataBase`.

## P2 - Structured data

- JSON-LD helper:
  - `app/components/JsonLd.tsx`
- SoftwareApplication schema:
  - `app/page.tsx`
- FAQ schema:
  - `app/pricing/page.tsx`
- BreadcrumbList schema:
  - `app/pricing/page.tsx`
  - `app/login/page.tsx`
  - `app/s/[token]/page.tsx`

## P3 - Sitemap + robots

- Dynamic sitemap:
  - `app/sitemap.ts`
  - Includes public, indexable routes (`/`, `/pricing`).
- Robots config:
  - `app/robots.ts`
  - Allows public marketing routes and disallows auth/app/API/share routes.
- Proxy pass-through for crawl files:
  - `proxy.ts`
  - Adds explicit allow for `/robots.txt` and `/sitemap.xml`.

## P4 - Performance for marketing routes

- Homepage image handling improved:
  - `app/page.tsx`
  - Migrates landing images from raw `<img>` to `next/image`.
  - Hero image marked `priority`; lower sections lazy-loaded.
- Static asset caching:
  - `next.config.ts`
  - Adds immutable cache header for `/_next/static/*`.

## P5 - Internal linking/content infra

- Breadcrumb UI added:
  - `app/pricing/page.tsx`
  - `app/login/page.tsx`
- Existing product-page CTA network remains in place:
  - Homepage links users to pricing and login paths.

## P6 - Programmatic pages (proposal)

No existing blog/content infrastructure was found, so this is a blueprint:

- Proposed route structure:
  - `/use-cases/[slug]` (e.g. `indie-venue`, `tour-promoter`)
  - `/templates/[slug]` (e.g. `guarantee-deal`, `guarantee-vs-percentage`)
  - `/compare/[slug]` (e.g. `gigsettle-vs-spreadsheets`)
- Proposed data source:
  - local typed content objects in `lib/seo-content.ts` for initial launch
  - migrate to CMS/MDX later if needed
- Proposed template file:
  - `app/use-cases/[slug]/page.tsx` with metadata + JSON-LD + internal links to `/pricing` and `/login`
