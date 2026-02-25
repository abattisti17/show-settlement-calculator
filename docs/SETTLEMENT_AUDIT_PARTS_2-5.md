# Settlement Audit — Parts 2–5

**Date:** 2025-02-25  
**Context:** Parts 2–5 of the real-world workflow audit. See [SETTLEMENT_REAL_WORLD_WORKFLOW.md](./SETTLEMENT_REAL_WORLD_WORKFLOW.md) for Part 1.

---

# PART 2 — Compare to This App

## Workflow Steps We Do NOT Support

| Real-World Step | App Support | Gap |
|-----------------|-------------|-----|
| **Pre-populate from ticket report** | None | No import from Eventbrite, AXS, DICE, See Tickets. All numbers are manual entry. |
| **Reconcile gross to ticketing system** | None | No "expected gross" vs "entered gross" check. No way to verify numbers match the ticket report. |
| **Door count vs. tickets sold** | None | No head count field; no reconciliation to physical count. |
| **Show date capture** | Schema exists, no UI | `show_date` column exists in `shows` table but there is no form field in `calculator-content.tsx`. Shared view shows it only if present. |
| **Comp list / artist vs. house comps** | Partial | Comps are a single number per tier. No distinction between artist comps vs. house comps (contract may treat them differently). |
| **Service / facility fees** | None | Ticketing systems often keep a cut. No way to separate "artist gross" from "ticketing gross." |
| **Refunds / chargebacks** | None | Post-show adjustments not supported. |
| **Multi-night run aggregation** | None | Each show is standalone. |
| **Payment confirmation** | None | No field for "check #" or "wire confirmation." |
| **W-9 / tax form reminder** | None | Withholding exists but no prompt to collect W-9. |

---

## Assumptions That Don't Match Real-World Behavior

| Assumption | Reality |
|------------|---------|
| **User has numbers ready** | Often the ticket report isn't ready until 1–2am. User may be entering from a printed sheet or phone screenshot. |
| **User knows the deal structure** | Contract may say "85% of net" — user might not know if that's before/after CC fees. No guidance. |
| **One person enters everything** | In reality, venue accountant enters; tour manager reviews. Shared view is read-only — tour manager can't annotate disputes before acknowledging. |
| **Expenses are known at settlement time** | Production manager may have left. Receipts might be incomplete. No "pending" or "estimated" state. |
| **Merch is a single number** | Merch seller may hand over cash + card total. No breakdown. (App handles this — single gross is fine.) |
| **Acknowledgment = agreement** | Acknowledgment says "reviewed" not "agreed." Legally ambiguous. |
| **Save happens before share** | User can share a link before saving. Share link points to current DB state — if they never saved, the shared view may be stale or empty. |

---

## Missing Financial Line Items

| Item | Status | File / Location |
|------|--------|-----------------|
| **Service / facility fees** | Missing | Not in `FormData` or `computeSettlement` |
| **Ticketing provider cut** | Missing | Often 2–5% of gross; separate from CC fees |
| **Walk-up vs. advance sales** | Missing | Single blended price per tier |
| **VIP / meet-and-greet revenue** | Missing | Would need separate revenue stream |
| **Ancillary revenue** (parking, coat check) | Missing | Not modeled |
| **ASCAP/BMI/SESAC** | In COMMON_EXPENSES | Supported as expense label |
| **Artist-approved vs. venue-imposed expenses** | Missing | All expenses treated equally; no flag for "rider-approved" |

---

## Missing Validation Safeguards

| Safeguard | Current State | Risk |
|-----------|---------------|------|
| **Empty field → 0** | `parseNumber` returns 0 silently | User clears `totalExpenses` by accident → net inflates, artist overpaid. `warnIfNotNumeric` only fires when value is non-empty and non-numeric. |
| **Deposit > artist payout** | Warning only | `warnings.push("Venue payout is negative")` for venue loss, but no explicit "Overpayment" warning when deposit exceeds payout. Overpayment case exists (`balanceDue < 0`) but could be clearer. |
| **Negative inputs** | `min={0}` on some inputs | Not all number inputs have `min`. User could enter -500 for an expense. |
| **Capacity vs. sold** | Optional capacity, no check | If capacity=300 and sold=400, no warning. |
| **Comps > sold** | No check | Could enter 100 comps, 50 sold — nonsensical. |
| **Re-calc before save** | Yes | `handleSaveShow` calls `computeSettlement` — good. But if user edits after save, "Update" is disabled when `!resultsStale` — so they must recalc. However, they can share before recalculating if they had a prior result. |
| **Stale results on share** | No check | Share link shows whatever is in DB. If user shared, then edited but didn't save, the tour manager sees old numbers. No "last saved" vs "current" indicator on share page. |

---

## Where a User Could Make a Costly Mistake

| Mistake | How It Happens | Cost |
|---------|----------------|------|
| **Wrong deal type** | Select "Guarantee" instead of "Guarantee vs. Percentage" | Artist underpaid or overpaid by thousands. |
| **Forget deposit** | Leave deposit field empty when 50% was wired | Artist overpaid; venue claws back later. |
| **Wrong percentage** | Type 15 instead of 85 | Artist gets 15% instead of 85%. |
| **Wrong CC fee mode** | "Off the top" vs "venue expense" changes net | Artist/venue split shifts. |
| **Clear expense by accident** | Backspace in amount field; `parseNumber` → 0 | Net inflates; artist overpaid. |
| **Share before save** | Share link, then edit, never save | Tour manager sees stale data; pays wrong amount. |
| **Multi-artist: wrong order** | Add artist 2, deal applies to wrong gross | Guarantee vs. percentage order matters for split. |
| **Buyout mode wrong** | "Deduct from balance" vs "show expense" | Changes who pays; changes net. |

---

## Where Reconciliation Errors Could Occur

| Source | Location | Detail |
|--------|----------|--------|
| **Ticket report mismatch** | Manual entry | User types 347 from ticket report; fat-finger 374. No check. |
| **Tier revenue sum ≠ gross** | `computeSettlement` | `round2(price * sold)` per tier, then sum. Rounding per tier can diverge from `round2(sum)` in edge cases. |
| **Expense sum ≠ totalExpenses** | `parsedExpenseItems.reduce` | Same rounding. If someone edits `inputs` JSONB directly, sum could diverge. |
| **Results vs. inputs drift** | Save flow | `handleSaveShow` recomputes from `formData` and overwrites `results`. Good. But if RLS or network fails mid-save, `inputs` could be saved without `results`. |
| **Multi-artist net allocation** | `computeArtistDealPayout` | All artists share same `netProfit`. If guarantee + guarantee + percentage, the first artist's guarantee reduces net for the second. Order of evaluation matters. Current logic: each artist gets their deal against the same net. For "guarantee vs %" the first artist taking guarantee doesn't reduce net for the second — correct for typical split. |

---

## UI Friction and Cognitive Overload

| Issue | Location | Impact |
|-------|----------|--------|
| **Long form** | `calculator-content.tsx` | Single scrollable form. Ticket tiers, tax, expenses, artists, buyouts, merch, notes — all in one pass. At 1am, easy to miss a section. |
| **No progressive disclosure** | All sections visible | Artist section repeats for each artist. No collapsible sections. |
| **"Calculate" is explicit** | No auto-calc | User must click "Calculate Settlement" after every change. `resultsStale` banner exists but requires user to notice and act. |
| **Deal type dropdown** | 6 options | "Guarantee vs Percentage (whichever is higher)" vs "Guarantee + Back-End Percentage" — similar names. Easy to pick wrong one. |
| **Expense note is small** | `calculator-note-input` | Per-expense notes exist but are easy to miss. "Artist disputes" needs to be prominent. |
| **Balance due buried** | In results | "Balance Due at Settlement" is in the artist block. For a single artist, it's there — but for multi-artist, it's per-artist. Could use a "Key number" callout at top. |
| **No "quick numbers"** | All manual | No "paste from ticket report" or "last show" template. |
| **Share requires save** | SharePopover | Share copies link. If user edits after save, they must recalc + save. Share link shows DB state. If they share, then edit, tour manager sees old data. No warning when sharing unsaved changes. |

---

# PART 3 — Risk & Trust Audit

## Where Users Might Not Trust the Output

| Concern | Why |
|---------|-----|
| **"What if I typed wrong?"** | No reconciliation check. No "verify gross matches ticket report" step. |
| **"Did the app change my numbers?"** | No audit trail. User can't see "I entered $X, it stored $Y." |
| **"Is the deal structure right?"** | Deal type labels are technical. "Guarantee vs Percentage" — user might not understand. No plain-language summary. |
| **"What about rounding?"** | Rounding happens at each step; `round2` is used. But user doesn't see the formula. No "calculation breakdown" view. |
| **"Can the artist see my edits?"** | Shared view is read-only. If venue updates after share, artist sees new version. No version history. |
| **"What if I share the wrong show?"** | Share link is per-show. No confirmation "You're about to share [Show Name] with [Balance Due]." |

---

## Where Transparency Needs to Improve

| Area | Current | Improvement |
|------|---------|-------------|
| **Deal structure summary** | "Guarantee vs Percentage (whichever is higher)" | Add: "Artist gets: $X guarantee OR 85% of net ($Y), whichever is higher → $Z." |
| **Expense attribution** | Itemized list | Good. Add: "Total expenses: $X (sum of above)." |
| **Gross revenue** | Per-tier breakdown | Good. Add: "Total tickets: X sold, Y comps." |
| **Balance due** | In artist block | Add: "**Pay this amount tonight:** $X" at top of summary. |
| **CC fee treatment** | "Off the top" vs "venue expense" | Label explains. Could add: "This reduces artist share" vs "Venue absorbs this." |
| **Staleness** | `resultsStale` banner | Good. Add: "Last calculated: [timestamp]" on share page. |
| **calculatedAt** | In `results` | Shown in footer on share page. Good. |

---

## Where Audit Logging Would Matter

| Event | Why |
|-------|-----|
| **Show created** | Who, when. |
| **Show updated** | What changed. Diff of `inputs` and `results`. |
| **Share link created** | Who shared, when. |
| **Share link viewed** | Token used, IP, timestamp. (Privacy: consider.) |
| **Acknowledgment** | Already captured: name, email, timestamp. |
| **Field-level edits** | Overkill for v1; useful for disputes. "Expense Sound changed from $500 to $600 at 1:23am." |

**Current state:** No audit log. `updated_at` on `shows` is the only timestamp. RLS policies don't log.

---

## What Should Be Printable & Exportable

| Output | Current | Gap |
|--------|---------|-----|
| **Settlement sheet** | Print button, `window.print()` | Uses print CSS. Good. |
| **CSV export** | `handleExportCSV` | Exists. Good. |
| **PDF** | No explicit PDF | User can "Print" → "Save as PDF" in browser. No dedicated PDF button. |
| **Deal memo summary** | Not exportable | Could add "Deal summary" section to CSV/print. |
| **Acknowledgment record** | In shared view | Not in CSV export. Should be. |
| **Show date** | In shared view if set | Not in form — no way to set it. |

---

## What Confirmations or Double-Checks Should Exist

| Action | Current | Recommendation |
|--------|---------|----------------|
| **Save** | No confirmation | Toast "Show saved." Exists. |
| **Share** | Copy link | Add: "Share [Show Name]? Balance due: $X." before copy. |
| **Overpayment** | Warning in banner | "Deposit exceeds artist payout. Artist owes $X back." |
| **Venue loss** | Warning | Exists. Good. |
| **Large change** | None | If user changes gross by >20%, consider: "Gross changed significantly. Reconcile with ticket report." |
| **Acknowledgment** | Form submit | "By acknowledging, you confirm you have reviewed this settlement report." — exists. Could add: "I agree to the numbers above" or "I have reviewed with noted disputes." — more explicit. |

---

# PART 4 — Roadmap to Improve (Design-System-Only)

**Constraints:** All UI must use existing `components/ui/` components. No new visual styles. Reuse and extend. Composition over new components.

---

## 1. Critical Fixes (Must Ship Before Real Users)

| Item | Why | Risk Reduced | Components | Complexity |
|------|-----|--------------|------------|------------|
| **Show date field** | Real-world settlements need show date for records, W-9, tax. Schema exists, no UI. | Missing tax/audit docs. | `Input` | Low |
| **Overpayment explicit warning** | When deposit > artist payout, show clear "Artist owes $X back" message. | Overpayment paid; clawback dispute. | `Badge` variant warning, existing warning div | Low |
| **Share confirmation with key number** | Before copying share link, show "Share [Show Name]? Balance due: $X." | Sharing wrong show; tour manager pays wrong amount. | `Popover` content, `DescriptionList` | Low |
| **Prevent share when results stale** | Disable share or warn when `resultsStale` and user hasn't saved. | Tour manager sees stale numbers. | `Button` disabled, or `Popover` warning | Low |
| **Save before share enforcement** | If no `currentShowId`, user must save before share. Share button only available for saved shows. | Shared view empty or from different show. | Already: SharePopover only when `currentShowId` | — (done) |
| **Warn when sharing with stale results** | When `resultsStale`, Share copies link to *last saved* state. Tour manager sees old numbers. Disable share or show warning when stale. | Tour manager pays wrong amount. | `Button` disabled when `resultsStale`, or `Popover` warning | Low |

---

## 2. High-Impact Improvements (Workflow Alignment)

| Item | Why | Risk Reduced | Components | Complexity |
|------|-----|--------------|------------|------------|
| **"Balance Due" callout at top of summary** | The number that matters at 1am. Currently buried in artist block. | Wrong amount paid; cognitive load. | `Card` with `BreakdownList.Row` variant="success", or new `SectionFooter`-style block | Low |
| **Deal structure plain-language summary** | "Artist gets: $10,000 guarantee OR 85% of net ($8,500), whichever is higher → $10,000." | Wrong deal type selected; user doesn't understand. | `DescriptionList` | Medium |
| **Auto-calculate on save** | When user clicks Save, always recalc from inputs. Already done. | Stale results saved. | — | — (exists) |
| **Warn when clearing a field** | If `parseNumber` would return 0 for a field that had a value, show warning. | Accidental clear → wrong numbers. | `warnIfNotNumeric` for empty when previous had value — need to track "previous" | Medium |
| **Capacity vs. sold validation** | If capacity > 0 and sold > capacity, warn. | Obvious data entry error. | Inline warning, `Badge` or `calculator-warnings` | Low |
| **Comps vs. sold validation** | If comps > sold, warn. | Nonsensical data. | Same | Low |
| **Negative expense warning** | Reject or warn on negative expense amounts. | Expense sign flips net. | `Input` validation, `warnIfNotNumeric`-style | Low |

---

## 3. Quick Wins (1–3 Day Improvements)

| Item | Why | Risk Reduced | Components | Complexity |
|------|-----|--------------|------------|------------|
| **Add `calculatedAt` to summary** | "Calculated 2/25/2025 1:23 AM" — builds trust. | "When was this calculated?" | `DescriptionList.Item` or footer text | Low |
| **Include acknowledgments in CSV export** | Tour manager needs record. | No proof of agreement. | `handleExportCSV` | Low |
| **Include show date in CSV** | If set. | Incomplete records. | `handleExportCSV` | Low |
| **"Last saved" on dashboard** | "Last saved: 2 min ago" — already exists. | — | — | — |
| **Collapsible sections** | Reduce scroll. | Cognitive overload. | `Card` with toggle? No collapsible in DS. Use `SectionFooter` + `Button` to expand? Or just `details`/`summary` HTML. | Low (native HTML) |
| **Deal type tooltips** | "Guarantee vs %: Artist gets the higher of guarantee or percentage of net." | Wrong selection. | `Popover` or `title` attribute | Low |

---

## 4. Structural Improvements (Architecture / Data Model)

| Item | Why | Risk Reduced | Components | Complexity |
|------|-----|--------------|------------|------------|
| **Server-side recalculation on save** | API receives `inputs`, recalculates `results`, stores both. Client can't send stale `results`. | Client bug; stale results. | Backend | Medium |
| **`calculatedAt` in results** | Already exists. | Staleness detection. | — | — |
| **Audit log table** | `show_audit_log(show_id, user_id, action, changes, created_at)`. | Dispute resolution; "who changed what." | — | High |
| **Share link version** | Store `results` snapshot when share link is created. Shared view shows that snapshot, not live. | Venue edits after share; artist sees different numbers. | — | Medium |
| **Expense "rider-approved" flag** | `ExpenseItem { ..., riderApproved?: boolean }`. | Dispute: "contract says only rider expenses." | `Input` or `Select` | Medium |

---

## 5. Trust & Export Improvements

| Item | Why | Risk Reduced | Components | Complexity |
|------|-----|--------------|------------|------------|
| **Print-optimized settlement sheet** | Single page, clear hierarchy. | Unreadable printout. | `shared-settlement.css` print styles | Low |
| **PDF download button** | "Download PDF" — uses print-to-PDF. | User doesn't know they can. | `Button` | Low |
| **Export includes all line items** | CSV already does. | — | — | — |
| **Acknowledgment in print** | Shared view shows acknowledgments. | Print doesn't include? Check. | — | Low |
| **"Reconcile to ticket report"** | Optional field: "Expected gross from ticket report." If different from calculated gross, warn. | Transcription error. | `Input` + `Badge` warning | Medium |

---

# PART 5 — Stress Test Scenario

## Scenario

- **Venue:** Mid-size (500 cap)
- **Deal:** $10,000 guarantee vs. 85/15 after expenses (artist gets higher of guarantee or 85% of net)
- **Merch:** 20% venue cut
- **CC fees:** 2.9% off the top
- **Production expenses:** Sound $1,200, Lights $800, Security $600, Stagehands $400, Catering $300
- **Tax:** 10% sales tax (exclusive)
- **Tickets:** GA $25 × 320 sold, VIP $50 × 40 sold. 10 comps (GA).

**Expected gross:** $25×320 + $50×40 = $8,000 + $2,000 = $10,000  
**Tax:** $1,000  
**CC fees:** $290 (off top)  
**Expenses:** $3,300  
**Net:** $10,000 − $1,000 − $290 − $3,300 = $5,410  
**Artist:** max($10,000, 85% × $5,410) = max($10,000, $4,598.50) = **$10,000** (guarantee)  
**Venue:** $5,410 − $10,000 = **−$4,590** (venue loss)

---

## How This Would Flow in the App (Current)

1. **Create show** — User clicks "Create New Show" from dashboard.
2. **Show name** — "Summer Fest 2026" or similar.
3. **Ticket tiers** — Add GA: $25, 320 sold, 10 comps. Add VIP: $50, 40 sold, 0 comps.
4. **Tax & fees** — Tax 10%, exclusive. CC 2.9%, off the top.
5. **Expenses** — Add 5 rows: Sound $1200, Lights $800, Security $600, Stagehands $400, Catering $300.
6. **Artist** — Name "Headliner", Deal "Guarantee vs Percentage", Guarantee $10000, Percentage 85.
7. **Deposit** — Say 50% wired: $5000.
8. **Merch** — $2000 gross, 20% venue.
9. **Calculate** — User clicks "Calculate Settlement".

**Result:** Balance due = $10,000 − $5,000 = $5,000. Venue loss $4,590. Merch: $400 to venue, $1,600 to artist. Total due to artist: $5,000 + $1,600 = $6,600.

---

## Where Friction Occurs

| Step | Friction |
|------|----------|
| **Ticket entry** | Two tiers — fine. But user must type 320, 40, 10 from ticket report. No paste. No validation that 320+40=360 sold. |
| **Expenses** | Five items. User has receipts. Must add each. Common expenses datalist helps. |
| **Deal type** | "Guarantee vs Percentage" — user must know that's the right one. No "which deal do you have?" wizard. |
| **Venue loss** | Warning appears. Good. But user might not understand *why* — guarantee > net. No "Your guarantee is $10k but net is only $5.4k." |
| **Balance due** | $5,000 is in the artist block. For a tired user, "Pay this tonight" should be unmissable. |
| **Save** | User must save. Then share. If they edit after save, they must recalc + save again. |
| **Share** | Copy link. No "You're sharing a show with $5,000 balance due." |
| **Tour manager** | Opens link. Sees full settlement. Acknowledges. No way to dispute a line before acknowledging. |

---

## What Improvements Would Fix It

| Improvement | Fixes |
|-------------|-------|
| **"Balance Due" callout at top** | Tour manager sees $5,000 immediately. |
| **Venue loss explanation** | "Guarantee ($10,000) exceeds net ($5,410). Venue absorbs the loss." |
| **Share confirmation** | "Share [Summer Fest 2026]? Balance due: $5,000." — prevents wrong share. |
| **Stale results warning** | If user edits after save, can't share without recalc + save. Or warn when sharing. |
| **Deal structure summary** | "Artist gets: $10,000 guarantee OR 85% of net ($4,598.50) → $10,000." |
| **Show date** | Add field so shared view shows "Show Date: 2/25/2025." |
| **Reconcile gross** | Optional "Expected gross from ticket report: $10,000." Matches → user confident. |
| **Print-optimized** | One clean page for backstage. |

---

## Blunt Assessment

**At 12:45am backstage after a loud show:**

- **Correctness:** The math is right. Guarantee vs. %, CC off top, expenses, merch — all correct.
- **Clarity:** The summary is long. "Balance Due at Settlement" is in the artist block. A tired tour manager might scroll past it. **Call it out at the top.**
- **Speed:** Form is long. No auto-calc. User must click Calculate. Consider: auto-calc on blur (debounced) or when all required fields filled. But that could be jarring. Explicit Calculate is safer for financial tool — user confirms intent.
- **Trust:** No reconciliation. No "does this match your ticket report?" User is trusting their own typing. Add optional gross check.
- **Print:** Print works. But shared view is long. A single-page "settlement summary" for print — gross, net, artist payout, balance due, merch, total due — would be ideal.

**Optimize for:** Correctness (already good), clarity (callout balance due), speed (reduce form length with collapsible sections or templates), trust (reconciliation field, deal summary).

---

*End of Parts 2–5.*
