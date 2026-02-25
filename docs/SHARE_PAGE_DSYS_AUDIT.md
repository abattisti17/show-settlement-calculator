# Share Page Design System Audit

**Page:** `/s/[token]` (shared settlement) + `/s/[token]` not-found  
**Date:** 2026-02-24

---

## What is already dsys

| Area | Component | Notes |
|------|-----------|--------|
| **Shell** | `MarketingShell` | Nav (logo, Pricing, Log in, Sign up) + footer. ✅ |
| **Main wrapper** | `Card` | Wraps report content (`settlement-packet-content`) and not-found content (`settlement-not-found`). ✅ |
| **Not-found CTA** | `Button` | "Create Your Own Settlement" uses `<Button as="a" href="/" variant="primary">`. ✅ |

---

## What is not dsys (custom markup + CSS in `globals.css`)

### 1. Page header (report title block)

- **Current:** `<header class="settlement-packet-header">` with `<h1>` "Show Settlement Calculator" and `<p class="settlement-packet-subtitle">` "Settlement Report".
- **Uses:** dsys tokens only (`--text-2xl`, `--color-text-strong`, `--color-accent`, `--text-sm`). No dsys component.

**Recommendation:** Use existing **`PageHeader`** with `title="Show Settlement Calculator"` and `description="Settlement Report"`. No new component. Optional: omit breadcrumb (already not present).

---

### 2. Section titles (e.g. "Show Information", "Deal Structure")

- **Current:** `<h2 class="settlement-section-title">` with custom CSS (small caps / accent color, `--text-sm`, `--color-accent`).
- **Uses:** dsys tokens only. No dsys component.

**Recommendation:** **Option A (preferred):** Keep as semantic `<h2>` and a single utility class (e.g. `ds-section-title`) in globals or a small shared CSS file so section headings are consistent app-wide. **Option B:** Add a dsys **`SectionTitle`** component (wrapper around `h2` with the same style) if you want it in the component library. Propose **Option A** unless you want SectionTitle reused on dashboard/calculator.

---

### 3. Label/value pairs (Show Information, Deal Structure, Show Details)

- **Current:** Grid of items: `.settlement-info-grid` > `.settlement-info-item` with `.settlement-label` and `.settlement-value` (e.g. "Show Name:", "mcr revival show").
- **Uses:** dsys tokens. No dsys component.

**Proposal — new component: `DescriptionList`**

- **Purpose:** Reusable key/value list (e.g. show info, deal structure, show details).
- **API (sketch):**
  - `DescriptionList`: wrapper (grid, gap).
  - `DescriptionList.Item`: single row with `label` and `value` (or `children` for value).
  - Optional: `columns` prop for responsive grid (e.g. `repeat(auto-fit, minmax(250px, 1fr))`).
- **Styling:** Use existing tokens (`--color-text-muted` / `--color-text`, `--text-sm` / `--text-base`). Same look as current share page.
- **Usage:** Replace all `.settlement-info-grid` / `.settlement-info-item` blocks with `<DescriptionList>` and items.

**Sign-off:** Do you want this component? If yes, we implement it and refactor the three sections to use it.

---

### 4. Settlement breakdown (result rows + divider)

- **Current:**
  - Container: `.settlement-breakdown` (panel background, padding, border-radius).
  - List: `.settlement-results` with:
    - **Default row:** `.settlement-result-row` (label + value, surface background).
    - **Negative row:** same + `.settlement-negative` on value (red).
    - **Highlight row:** `.settlement-highlight` (accent bg/border, larger value).
    - **Divider:** `.settlement-divider` (horizontal rule).
    - **Success row:** `.settlement-artist-payout` (success bg/border).
    - **Warning row:** `.settlement-venue-payout` (warning bg/border).
- **Uses:** dsys tokens and semantic colors. No dsys component.

**Proposal — new component: `BreakdownList` (or `ResultList`)**

- **Purpose:** Vertical list of result rows with optional divider and row variants (default, negative, highlight, success, warning).
- **API (sketch):**
  - `BreakdownList`: wrapper (same panel look: background, padding, radius). Optional `className` for overrides (e.g. shared-settlement light gray).
  - `BreakdownList.Row`: `label`, `value`, `variant?: 'default' | 'negative' | 'highlight' | 'success' | 'warning'`.
  - `BreakdownList.Divider`: visual separator between groups.
- **Styling:** Reuse current tokens (surface, accent-bg, success-bg, warning-bg, error color, etc.). Keep tabular/mono value styling.
- **Usage:** Replace the whole "Settlement Breakdown" section markup with `<BreakdownList>` and rows/divider.

**Sign-off:** Do you want this component? If yes, we implement it and refactor the breakdown section.

---

### 5. Footer inside the card (generated date + link + note)

- **Current:** `<footer class="settlement-packet-footer">` with:
  - `.settlement-footer-text`: "Generated on … via [link]."
  - `.settlement-footer-note`: "This is a shared settlement report. Sign up to create your own settlements."
- **Uses:** dsys tokens. No dsys component. `SectionFooter` exists but is a full-bleed dark panel, so not a fit.

**Recommendation:** **Option A (preferred):** Keep as custom footer markup and a single class (e.g. `ds-card-footer` or keep `settlement-packet-footer`) in globals, so it stays simple and doesn’t require a new component. **Option B:** Add a minimal **`CardFooter`** in dsys (centered text + optional link + muted note) if you plan to reuse this pattern elsewhere. Propose **Option A** unless you want reuse.

---

### 6. Not-found state (icon + title + description + CTA)

- **Current:** Inside `Card`: custom SVG icon div, `h1.settlement-not-found-title`, `p.settlement-not-found-description`, `div.settlement-not-found-actions` with `Button`.
- **Uses:** `Card` + `Button`. Icon and typography are custom.

**Proposal — optional new component: `EmptyState`**

- **Purpose:** Reusable "no data" / "not found" block: optional icon, title, description, and action slot.
- **API (sketch):** `EmptyState` with `icon?: ReactNode`, `title`, `description?`, `actions?: ReactNode`, optional `className`.
- **Usage:** Not-found page would use `<EmptyState icon={…} title="…" description="…" actions={<Button …>…</Button>} />` inside the existing `Card`.

**Sign-off:** Optional. If you prefer to keep the not-found page as simple custom markup (already using Card + Button), we can skip this and only add a small shared class for icon + title/description styling. If you want a reusable empty/not-found pattern, we add `EmptyState`.

---

## Summary table

| # | Element | Current | Recommendation |
|---|--------|---------|----------------|
| 1 | Page header | Custom header + h1 + subtitle | Use **PageHeader** (existing). |
| 2 | Section titles | Custom h2 + CSS | **Option A:** Keep h2 + shared class. **Option B:** New **SectionTitle** component. |
| 3 | Label/value grids | Custom grid + items | **Propose:** New **DescriptionList** (sign-off). |
| 4 | Breakdown section | Custom section + rows + divider | **Propose:** New **BreakdownList** (sign-off). |
| 5 | Card footer | Custom footer + text + link | **Option A:** Keep custom + class. **Option B:** New **CardFooter** (optional). |
| 6 | Not-found block | Custom icon + text + Button | **Option A:** Keep custom. **Option B:** New **EmptyState** (optional). |

---

## Next steps

1. You sign off on:
   - **PageHeader** for the report title (no new component).
   - **Section titles:** Option A (shared class) vs Option B (SectionTitle component).
   - **DescriptionList:** yes/no.
   - **BreakdownList:** yes/no.
   - **Card footer:** Option A (keep custom) vs Option B (CardFooter).
   - **EmptyState:** yes/no for not-found.
2. I implement the agreed changes: use existing components where chosen, add new components only where you approved, then refactor the share page (and optionally not-found) to use them and trim dead CSS.
