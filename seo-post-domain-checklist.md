# SEO Checklist: Post-Domain Launch

## Day 1 — Immediately After Adding Domain

- [ ] **Update all canonical URLs** in `lib/seo.ts` — replace `show-settlement-calculator.vercel.app` with your real domain
- [ ] **Update sitemap.xml** base URL
- [ ] **Update robots.txt** sitemap reference URL
- [ ] **Update OG meta tags** — og:url should point to real domain
- [ ] **Update structured data** (JSON-LD) — any hardcoded URLs
- [ ] **Set up Google Search Console** — verify ownership, submit sitemap
- [ ] **Set up Bing Webmaster Tools** — same deal, takes 2 minutes
- [ ] **Verify in incognito**: `/robots.txt`, `/sitemap.xml`, view-source on `/` and `/pricing` all look correct with new domain

## Week 1 — Foundation

- [ ] **Set up Google Analytics** (or Plausible/Fathom if you prefer privacy-friendly)
- [ ] **Validate structured data** at https://search.google.com/test/rich-results
- [ ] **Test OG tags** at https://www.opengraph.xyz
- [ ] **Run Lighthouse** on `/` and `/pricing` — target 90+ performance
- [ ] **Check Core Web Vitals** in Search Console once data populates (takes a few days)
- [ ] **Set up Vercel Analytics** if not already (free tier gives Web Vitals data)

## Month 1 — Content That Converts (BOFU First)

- [ ] **Write 3–5 comparison pages** (highest converting SEO content):
  - `/compare/gigsettle-vs-manual-spreadsheets`
  - `/compare/gigsettle-vs-[any-competitor]`
  - `/blog/best-settlement-tools-for-music-venues`
- [ ] **Write 1 "ultimate guide"** targeting your core keyword:
  - e.g., "The Complete Guide to Show Settlements for Music Venues"
- [ ] **Add FAQ section** to homepage or pricing page with FAQ schema (JSON-LD)
- [ ] **Ensure every page links** to at least 2–3 other pages on your site

## Month 2–3 — Build Authority

- [ ] **Publish 2 blog posts/month** targeting pain-point keywords:
  - "How to calculate show settlements"
  - "Venue promoter split explained"
  - "What to include in a show settlement packet"
  - (Use actual language from customer conversations)
- [ ] **Programmatic pages** if applicable:
  - `/templates/[genre-or-venue-type]` — settlement templates by use case
  - `/use-cases/[venue-type]` — one page per venue type you serve
- [ ] **Get backlinks naturally:**
  - Post in music industry forums, subreddits, Facebook groups (genuinely helpful, not spammy)
  - Write a "building in public" post about creating the product
  - Pitch guest posts to music industry blogs

## Ongoing — Monthly Maintenance

- [ ] **Check Search Console** for crawl errors, indexing issues, new keyword opportunities
- [ ] **Update old content** — Google rewards freshness, revisit posts every 6 months
- [ ] **Monitor Core Web Vitals** — don't let them degrade as you add features
- [ ] **Track signups from organic traffic** — this is the only metric that matters

## Cursor Prompt for Domain Migration

Paste this into Cursor when you're ready:

```
I just added a custom domain: [YOUR-DOMAIN.com]. I need you to:

1. Find and replace ALL instances of "show-settlement-calculator.vercel.app" 
   with "[YOUR-DOMAIN.com]" across the entire codebase — metadata, sitemaps, 
   robots.txt, structured data, canonical URLs, OG tags, everything.

2. Verify with `next build` that the output HTML for / and /pricing 
   contains the new domain in all meta tags, canonicals, and OG URLs.

3. List every file you changed so I can review before deploying.
```
