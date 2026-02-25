# Settlement Flow Audit

**Date:** 2025-02-25
**Scope:** Full review of the settlement calculator logic, data model, and shared settlement view.
**Perspective:** Venue accountant / tour manager — focused on real-world accuracy, dispute prevention, and reconciliation integrity.

---

## Current State

The calculator supports three deal types (`guarantee`, `percentage`, `guarantee_vs_percentage`) and produces six output values:

| Line Item | Calculation |
|---|---|
| Gross Revenue | `ticketPrice × ticketsSold` |
| Tax | `grossRevenue × (taxRate / 100)` |
| Expenses | Single `totalExpenses` field |
| Net Profit | `grossRevenue − tax − expenses` |
| Artist Payout | Depends on deal type |
| Venue Payout | `netProfit − artistPayout` |

**Files reviewed:**
- `app/calculator-content.tsx` — form, validation, calculation logic
- `app/s/[token]/page.tsx` — shared settlement view
- `supabase/migrations/20260130231757_remote_schema.sql` — `shows` and `share_links` tables

---

## 1. Missing Line Items

### Revenue Side

| Missing Item | Why It Matters |
|---|---|
| **Multiple ticket tiers** | Nearly every show has 2+ price points (GA, VIP, balcony). A single `ticketPrice × ticketsSold` cannot represent this. Need repeatable rows: tier name, price, qty sold, qty comped. |
| **Complimentary tickets (comps)** | Artist comps and house comps affect capacity math and can trigger disputes about "potential gross." |
| **Service / facility fees** | Often excluded from the artist's gross per contract. No way to separate them currently. |
| **VIP / meet-and-greet upsells** | Separate revenue stream, often with its own split. |
| **Ancillary revenue** | Parking, coat check, bottle service — sometimes included in the split, sometimes not. |

### Expense Side

| Missing Item | Why It Matters |
|---|---|
| **Itemized expenses** | A single `totalExpenses` field is the #1 dispute source in live events. Real settlements itemize: sound, lights, stagehands, security, catering/hospitality, backline, runner/transport, ASCAP/BMI/SESAC, insurance, marketing, ticket printing, CC processing, etc. |
| **Artist-approved vs. venue-imposed expenses** | Contracts specify which expenses are deductible before the split. Mixing them in one bucket guarantees arguments. |
| **Production buyout** | When the artist takes a lump sum to handle their own production — different flow than itemized expenses. |

### Payout Side

| Missing Item | Why It Matters |
|---|---|
| **Deposit / advance already paid** | Guarantees are rarely paid in full at settlement. Typically 50% is wired weeks before the show. Settlement should show "balance due at settlement." |
| **Merch revenue & venue merch cut** | Standard 15–25% of gross merch to venue. Usually settled simultaneously. |
| **Bonuses / overage structure** | "Guarantee + 85% of net after breakeven" is distinct from guarantee-vs-percentage. It's guarantee *plus* a back-end overage. |
| **Withholding taxes** | Some states require the venue to withhold a percentage for non-resident performers (CA, NY, etc.). Separate from sales tax. |
| **Credit card processing fees** | ~3% of gross. Whether deducted from gross or listed as an expense affects the split. |
| **ASCAP / BMI / SESAC licensing** | Venues pay these; deductibility from the split is contract-dependent. |

---

## 2. Edge Cases

### Deal Structure Gaps

| Gap | Description |
|---|---|
| **Guarantee + back-end overage** | "Guarantee PLUS percentage of net above breakeven." The most common mid-level touring deal. Not supported. |
| **Door deal / split from dollar one** | "80% of gross after tax" — no guarantee, no expenses deducted. Current "percentage" type deducts expenses, but a true door deal often does not. |
| **Percentage of gross vs. net** | Current model only supports percentage of net. Percentage of gross (before expenses) is common in some markets. |
| **Promoter profit split** | "After guarantee and expenses, remaining net splits 85/15." Current model treats venue payout as leftover, not a negotiated split. |
| **Co-headliner / multi-act splits** | Two artists with separate deals against the same gross. |

### Numeric / Logic Edge Cases

| Issue | Detail |
|---|---|
| **Negative venue payout** | If guarantee > net, venue absorbs the loss. No warning in the UI. |
| **Tax-inclusive pricing** | "$25 ticket" might mean $25 including tax or $25 + tax. The model is ambiguous. |
| **No venue capacity** | Can't show "X of Y sold" or calculate potential gross. |
| **Floating point arithmetic** | `19.99 × 347` can produce rounding artifacts. Currency math should use integer cents or round at each step. |
| **`parseNumber` returns 0 on empty input** | If someone clears `totalExpenses`, it silently becomes $0 — inflating net and artist payout with no warning. |

---

## 3. Dispute-Prone Areas

| Scenario | Risk |
|---|---|
| **"What counts as an expense?"** | One field, no itemization = artist's tour manager can't verify deductions. |
| **Gross vs. net percentage ambiguity** | Label says "Percentage of Net" but contract might say "85% of adjusted gross." Both parties interpret differently. |
| **Comp count reducing gross** | Were comps included in `ticketsSold`? Impossible to tell. |
| **No audit trail** | `inputs` JSONB stores final values, not who entered what or when fields changed. |
| **No countersignature** | Shared link is read-only. No mechanism for artist's rep to acknowledge, dispute, or annotate. |
| **CC fee treatment** | 60–80% of tickets sold on cards. 3% of $50K = $1,500. No field to capture or allocate this. |
| **Uniform tax rate** | Some tickets may be tax-exempt (charity, non-profit). A single rate can't handle partial exemptions. |

---

## 4. Reconciliation Error Risks

| Risk | Detail |
|---|---|
| **Single ticket price assumption** | Blended average for $25 GA + $50 VIP will be wrong if actual mix differs from assumed ratio. |
| **Silent zero-fill** | `parseNumber` converts empty/invalid input to 0 without warning. |
| **No ticketing system integration** | All numbers are manual entry — transcription errors are inevitable on high-volume shows. |
| **Stored results can diverge from inputs** | If someone edits inputs but doesn't recalculate before saving, `results` won't match `inputs`. No server-side recalculation enforces consistency. |
| **No rounding strategy** | Amounts aren't rounded to 2 decimal places during calculation — only at display time. Stored values can be `1234.5678`. |
| **Tax type ambiguity** | Is `taxRate` sales tax? Amusement tax? Both? Lumping them creates mismatches with actual tax filings. |

---

## 5. Unsupported Real-World Scenarios

| Scenario | Description |
|---|---|
| **Multi-act bills** | Festival or multi-band show; each act has a different deal against the same gross. |
| **Multi-night runs** | Same artist, 3 nights. Deal often spans the full run, not per-night. |
| **Promoter-as-buyer** | Promoter renting a venue has a different cost structure (venue rental, crew minimums) than an in-house show. |
| **Walk-up vs. advance sales** | Different prices, different cash handling, different reconciliation needs. |
| **Refunds and chargebacks** | Post-show refunds reduce gross. Chargebacks hit weeks later. Need a way to adjust finalized settlements. |
| **International / multi-currency** | Non-USD settlements, foreign artist withholding, VAT. |
| **Deposits and payment schedule** | 50% on signing, balance at settlement. "Balance due tonight" is the number that matters. |
| **Merch settlement** | Done simultaneously. Venue takes 15–25% of gross merch. Inventory count before/after. |
| **Buyouts** | Catering, production, hotel buyouts — lump sums replacing itemized expenses. Common in riders. |
| **Cancellation / force majeure** | Cancelled show, rain-out, partial performance (30 min of a 90 min set). |
| **Notes / dispute annotations** | No way to attach per-line-item notes like "artist disputes $200 security charge." |
| **Historical comparisons** | "Last time this artist played here, gross was $X." Useful for projections and negotiations. |
