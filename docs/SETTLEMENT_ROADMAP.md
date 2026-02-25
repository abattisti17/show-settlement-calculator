# Settlement Calculator Roadmap

**Created:** 2025-02-25
**Source:** [Settlement Audit](./SETTLEMENT_AUDIT.md)
**Approach:** Ship in small, testable phases. Each phase should leave the app fully functional. No big-bang rewrites.

---

## Design System Rules (applies to ALL phases)

Every phase MUST be built using the existing design system (`components/ui/`). These rules are non-negotiable.

### Use existing components first

The following components are available and must be used before reaching for anything else:

| Component | Purpose |
|---|---|
| `Input` | All text/number fields |
| `Select` | All dropdowns |
| `Button` | All actions (primary, secondary, ghost, danger) |
| `Card` | All content containers |
| `PageHeader` | Page-level titles and descriptions |
| `BreakdownList` / `BreakdownList.Row` / `BreakdownList.Divider` | Settlement line items (supports `default`, `negative`, `highlight`, `success`, `warning` variants) |
| `DescriptionList` / `DescriptionList.Item` | Label/value pairs (show info, deal details) |
| `Badge` | Status indicators |
| `Icon` | Iconography |
| `SegmentedControl` | Toggle between modes/views |
| `AppShell` / `MarketingShell` | Page-level layout |
| `Popover` | Contextual overlays |
| `SectionFooter` | Section-level footers |
| `AuthorCard` | Attribution |
| `ThemeToggle` | Theme switching |

### No new components without approval

If a phase requires UI that can't be built with the components above, you MUST stop and get explicit approval before creating anything new. The approval request must include:

1. **What is needed** — describe the UI pattern (e.g., "a repeatable row group with add/remove controls")
2. **Why existing components can't solve it** — explain what was tried or considered, and specifically why composition of existing components falls short
3. **Minimal changes proposed** — the smallest possible addition that solves the problem. Prefer (in this order):
   - A new variant/prop on an existing component
   - A small composition wrapper in the feature code (not in `components/ui/`)
   - A new design system component (last resort)

### Styling rules

- Use design tokens from `globals.css` (colors, spacing, typography, radii, shadows). No hardcoded values.
- All new CSS classes must follow existing naming conventions in the project.
- No inline styles except for truly one-off layout adjustments.
- Print styles must use the existing print token palette.

### What counts as "using the design system"

- Form sections: `Card` with `Input`, `Select`, `Button`
- Settlement output: `BreakdownList` with `BreakdownList.Row` variants for each line item type
- Info display: `DescriptionList` with `DescriptionList.Item`
- Section headers within cards: existing `.calculator-section-title` or `.ds-section-title` patterns
- Actions: `Button` with appropriate `variant` and `size` props
- Repeatable rows (expenses, ticket tiers): compose `Input` + `Button` (ghost/danger for remove) in a flex row — no custom component needed

---

## Phase 1 — Itemized Expenses

**Goal:** Replace the single `totalExpenses` field with a repeatable line-item list.

**Why first:** This is the #1 source of real-world disputes. Every other improvement is less impactful if expenses remain a black box.

### Tasks

- [ ] Define an `ExpenseItem` type: `{ label: string; amount: number }`
- [ ] Add a repeatable "add expense" UI in the calculator form (label + amount per row, add/remove buttons)
- [ ] Sum expense rows to produce `totalExpenses` for the existing calculation
- [ ] Store individual expense items in `inputs` JSONB (backward-compatible: old shows still load fine with their single `totalExpenses`)
- [ ] Render itemized expenses in the settlement summary and shared view
- [ ] Pre-populate common expense labels as suggestions (sound, lights, security, catering, backline, stagehands, insurance, marketing)
- [ ] Verify: old saved shows with a single `totalExpenses` still load and calculate correctly

### Acceptance

- User can add/remove expense line items
- Settlement summary shows each expense individually
- Shared view shows itemized expenses
- Backward-compatible with existing saved shows

---

## Phase 2 — Multiple Ticket Tiers

**Goal:** Support multiple ticket price points with separate quantities.

**Why second:** A single `ticketPrice × ticketsSold` is inaccurate for any show with more than one tier.

### Tasks

- [ ] Define a `TicketTier` type: `{ name: string; price: number; sold: number; comps: number }`
- [ ] Add a repeatable "add tier" UI (tier name, price, qty sold, qty comps)
- [ ] Calculate gross revenue as `Σ(tier.price × tier.sold)` across all tiers
- [ ] Display total tickets sold, total comps, and gross revenue broken out by tier in the summary
- [ ] Store tier data in `inputs` JSONB (backward-compatible: old shows still load as a single implicit tier)
- [ ] Update the shared view to show per-tier breakdown
- [ ] Add a capacity field (optional) to show "X of Y sold"

### Acceptance

- User can add/remove ticket tiers
- Gross revenue sums across tiers correctly
- Comps are tracked separately and don't inflate sold count
- Shared view shows per-tier detail
- Backward-compatible with existing saved shows

---

## Phase 3 — Deposit / Advance & Balance Due

**Goal:** Track the deposit already paid and surface "Balance Due at Settlement" — the number that actually matters at load-out.

### Tasks

- [ ] Add a `deposit` field to the form (amount already paid to artist)
- [ ] Calculate `balanceDue = artistPayout − deposit`
- [ ] Handle edge case: deposit > artistPayout (overpayment — show a clear warning)
- [ ] Display "Deposit Paid" and "Balance Due at Settlement" in the settlement summary
- [ ] Store `deposit` in `inputs` JSONB
- [ ] Update the shared view to show deposit and balance due

### Acceptance

- Settlement summary clearly shows deposit and balance due
- Overpayment scenario is flagged
- Shared view includes deposit info
- Backward-compatible

---

## Phase 4 — Guarantee + Back-End Overage Deal Type

**Goal:** Add the most common mid-level touring deal structure: "Guarantee plus a percentage of net after a breakeven point."

### Tasks

- [ ] Add a new `DealType`: `"guarantee_plus_percentage"`
- [ ] Add form fields: guarantee amount, percentage, breakeven point (optional — defaults to guarantee + expenses)
- [ ] Calculation: `artistPayout = guarantee + Math.max(0, (netProfit − breakeven) × (percentage / 100))`
- [ ] Clearly label the overage amount in the summary ("Back-End Overage: $X")
- [ ] Update the shared view to render this deal type
- [ ] Verify all existing deal types still work

### Acceptance

- New deal type selectable and calculates correctly
- Overage is $0 when net doesn't exceed breakeven
- Summary clearly shows guarantee, breakeven, overage, and total artist payout
- Backward-compatible

---

## Phase 5 — Door Deal & Percentage of Gross

**Goal:** Support "percentage of gross" and true door deals where expenses are not deducted before the artist's split.

### Tasks

- [ ] Add `DealType` options: `"percentage_of_gross"` and `"door_deal"`
- [ ] `percentage_of_gross`: `artistPayout = grossRevenue × (percentage / 100)` (tax deducted, expenses NOT deducted before split)
- [ ] `door_deal`: `artistPayout = (grossRevenue − taxAmount) × (percentage / 100)` (no expenses deducted)
- [ ] Clearly label what is deducted before the split for each deal type
- [ ] Update summary and shared view

### Acceptance

- Both new deal types calculate correctly
- User understands the difference via clear labels
- Backward-compatible

---

## Phase 6 — Calculation Integrity

**Goal:** Eliminate silent errors, enforce rounding, and prevent stale data.

### Tasks

- [ ] Round all currency values to 2 decimal places at each calculation step (not just at display)
- [ ] Warn when `parseNumber` falls back to 0 on a field that previously had a value (detect accidental clears)
- [ ] Auto-recalculate when inputs change (or at minimum, invalidate stale results and require re-calculation before saving)
- [ ] Add server-side recalculation on save: recompute `results` from `inputs` to guarantee consistency
- [ ] Add a `calculatedAt` timestamp to `results` so staleness is detectable
- [ ] Flag negative venue payout with a clear "Venue Loss" warning in the UI

### Acceptance

- No floating-point artifacts in stored or displayed values
- Cannot save stale results
- Venue loss scenario is clearly flagged
- Empty/cleared fields produce a warning, not silent zeros

---

## Phase 7 — Credit Card Fees & Tax Refinement

**Goal:** Handle CC processing fees and make tax handling more precise.

### Tasks

- [ ] Add a `ccFeeRate` field (percentage, e.g., 2.9%) and a toggle for whether it's deducted from gross or treated as an expense
- [ ] Calculate CC fees: `ccFees = grossRevenue × (ccFeeRate / 100)`
- [ ] Apply CC fees according to the toggle (off-the-top vs. expense line item)
- [ ] Rename `taxRate` to be more explicit; add a label/tooltip clarifying what it covers
- [ ] Support tax-inclusive pricing toggle ("ticket price includes tax" vs. "tax is added on top")
- [ ] Store CC fee settings in `inputs` JSONB

### Acceptance

- CC fees are visible as a line item in the summary
- Tax-inclusive toggle changes the calculation correctly
- Backward-compatible

---

## Phase 8 — Merch Settlement

**Goal:** Track merch revenue and venue merch cut alongside the show settlement.

### Tasks

- [ ] Add a merch section to the form: gross merch sales, venue merch percentage (default 20%)
- [ ] Calculate venue merch cut and net merch to artist
- [ ] Display merch settlement as a separate section in the summary (not mixed into the show waterfall)
- [ ] Include merch in a "Total Due to Artist" line: `balanceDue + netMerchToArtist`
- [ ] Store merch data in `inputs` JSONB
- [ ] Update the shared view

### Acceptance

- Merch and show settlements are clearly separated
- "Total Due to Artist" combines both
- Shared view includes merch section
- Backward-compatible

---

## Phase 9 — Withholding Tax & Buyouts

**Goal:** Support state withholding for non-resident artists and common rider buyouts.

### Tasks

- [ ] Add a `withholdingRate` field (percentage) and `withholdingState` label
- [ ] Calculate withholding: `withholdingAmount = artistPayout × (withholdingRate / 100)`
- [ ] Adjust balance due: `balanceDue = artistPayout − deposit − withholdingAmount`
- [ ] Add buyout fields (repeatable): `{ label: string; amount: number }` (catering buyout, production buyout, hotel buyout)
- [ ] Buyouts are subtracted from the artist payout or added to expenses, depending on contract (add a toggle)
- [ ] Update summary and shared view

### Acceptance

- Withholding is clearly shown as a separate deduction
- Buyouts are itemized
- Balance due accounts for deposits, withholding, and buyouts
- Backward-compatible

---

## Phase 10 — Multi-Act Support ✅

**Goal:** Allow multiple artists on a single show, each with their own deal structure.

### Tasks

- [x] Refactor the deal structure section to support multiple artists per show
- [x] Each artist gets: name, deal type, deal parameters (guarantee, percentage, etc.), deposit
- [x] All artists settle against the same gross/net
- [x] Show a per-artist payout breakdown and a combined venue settlement
- [x] Handle the "does one artist's guarantee reduce the net available to other artists?" question explicitly
- [x] Update the shared view to show per-artist breakdowns

### Acceptance

- 1-N artists per show, each with independent deal terms
- Total artist payouts + venue payout = net profit
- Shared view renders correctly for multi-act shows
- Single-act shows work identically to before

---

## Phase 11 — Notes, Annotations & Countersignature ✅

**Goal:** Let both parties document disputes and acknowledge the settlement.

### Tasks

- [x] Add a general notes field to the settlement
- [x] Add per-line-item notes (e.g., "artist disputes $200 security charge")
- [x] On the shared view, add an "Acknowledge" button that records the viewer's name/email and timestamp
- [x] Store acknowledgments in JSONB on `shows` (results.acknowledgments)
- [x] Show acknowledgment status on the dashboard ("Acknowledged by Tour Manager on 2/25")

### Acceptance

- Notes are visible in the summary and shared view
- Acknowledgment is recorded and surfaced
- No authentication required for acknowledging (link-based access)

---

## Future Considerations (Not Yet Scoped)

These are tracked for awareness but not prioritized into phases yet:

- **Multi-night run aggregation** — settle across a run, not per-night
- **Refunds & chargebacks** — post-show adjustments to finalized settlements
- **International / multi-currency** — non-USD, VAT, foreign withholding
- **Ticketing system import** — pull data from Eventbrite, DICE, AXS, See Tickets
- **Historical comparisons** — "last time this artist played here"
- **Cancellation / force majeure modeling** — partial shows, rain-outs
- **Promoter-as-buyer cost structure** — venue rental vs. in-house show
- **Walk-up vs. advance sales breakout**
- **Audit log** — who changed what field, when
