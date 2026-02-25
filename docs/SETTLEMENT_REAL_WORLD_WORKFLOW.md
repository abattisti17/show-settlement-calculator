# Part 1 — Real-World Workflow: Closing Out a Live Show Settlement

**Date:** 2025-02-25  
**Perspective:** Veteran tour manager, venue accountant, senior product designer  
**Scope:** Map the actual end-to-end process from load-in through final payment — realistic and messy, not idealized.

---

## 1. Roles Involved

| Role | Who They Are | When They're in the Room | What They Care About |
|------|--------------|--------------------------|----------------------|
| **Venue GM** | General Manager of the venue | Often absent until final numbers; may show up at 1am to "see how we did" | Bottom line, venue cut, liability, reputation |
| **Venue Accountant / Box Office Manager** | Person who reconciles ticket sales, runs the till, has the numbers | Present all night; often the one building the settlement | Accuracy, reconciling to ticketing system, not getting blamed |
| **Promoter Rep** | May be the venue (in-house) or external promoter | Present for load-in, soundcheck, show, settlement | Artist gets paid correctly; promoter margin; avoiding disputes |
| **Tour Manager** | Artist's representative; travels with the act | Present from load-in through settlement; often exhausted | Artist gets paid; expenses are fair; nothing gets missed |
| **Production Manager** | Oversees tech, crew, load-in/out | Present during load-in, show, load-out; may leave before settlement | Crew paid, expenses accounted for, tech rider fulfilled |
| **Merch Manager / Seller** | Artist's merch person | Counts merch before/after; may or may not be in settlement room | Merch gross, venue cut, inventory reconciliation |
| **Artist's Accountant / Business Manager** | Often remote; may receive settlement later | Not usually present | Clean numbers, tax docs, correct withholding |
| **Ticketing Provider Rep** | Eventbrite, AXS, DICE, See Tickets, etc. | Remote; report available next day or same night | Their cut, their numbers |
| **Catering / Hospitality** | In-house or external | May have invoices ready at load-out | Getting paid for rider items |
| **Security / Staff** | In-house or contracted | May hand over head count or invoices | Head count, overtime, incident reports |

**Reality:** The "settlement room" is often 2–4 people: venue accountant, tour manager, maybe promoter rep. Everyone else has left or is packing the bus. The GM might walk in, glance at the sheet, and leave.

---

## 2. Documents Referenced

### Pre-Show (Weeks to Days Before)

| Document | Who Has It | Purpose |
|----------|------------|---------|
| **Deal memo / Contract** | Both parties; often PDF in email | Guarantee, percentage, deal structure, deposit schedule |
| **Tech rider** | Production manager, venue | Backline, sound, lights — what's provided vs. bought |
| **Hospitality rider** | Catering, venue | Food, drinks, dressing room — buyouts vs. itemized |
| **Advance sheet** | Tour manager, venue | Load-in time, set times, comp list, special requests |

### Night of Show

| Document | Who Has It | Purpose |
|----------|------------|---------|
| **Ticket sales report** | Box office, ticketing system | Gross revenue, tier breakdown, comps, refunds — **the source of truth for revenue** |
| **Door count / Head count** | Security, box office | Physical count vs. tickets sold — reconciliation |
| **Expense receipts / invoices** | Venue, production manager | Sound, lights, stagehands, catering, backline, etc. |
| **Merch report** | Merch seller | Gross merch sales, sometimes inventory count |
| **Comp list** | Tour manager, box office | Who got in free; artist vs. house comps |

### Settlement (That Night or Next Day)

| Document | Who Creates It | Purpose |
|----------|----------------|---------|
| **Settlement sheet** | Venue accountant (usually) or promoter | The single document that reconciles everything |
| **W-9 / Tax forms** | Artist's rep | Withholding, 1099, non-resident performer tax |
| **Payment confirmation** | Both parties | Wire details, check number, "paid in full" acknowledgment |

**Reality:** The deal memo might be a 2-year-old PDF. The contract might say "85% of net" but nobody remembers if that's before or after CC fees. The ticket report might not be ready until 2am. Receipts are crumpled. The merch person might hand over a napkin with a number on it.

---

## 3. Calculations Typically Done Manually

| Calculation | How It's Usually Done | Error-Prone? |
|-------------|------------------------|--------------|
| **Gross revenue** | Ticket report: sum of (price × qty) per tier, or manual entry from report | Yes — wrong tier, wrong qty, comps mixed in |
| **Tax** | Often a flat %; sometimes "tax included" vs. "tax on top" — contract may be vague | Yes — jurisdiction varies; amusement vs. sales tax |
| **Expenses** | Add up receipts; some are pre-agreed (rider), some are disputed | **Very** — #1 dispute source |
| **Net profit** | Gross − tax − expenses | Only as good as inputs |
| **Artist payout** | Per deal: guarantee, or % of net, or guarantee vs. %, or guarantee + back-end | Yes — deal structure ambiguity |
| **Deposit / advance** | Subtract what was already wired | Sometimes forgotten |
| **Balance due** | Artist payout − deposit − withholding − buyouts | Must match the check/wire amount |
| **Merch** | Gross × venue % = venue cut; remainder to artist | Inventory disputes; cash vs. card mix |
| **CC fees** | ~3% of gross; sometimes off-the-top, sometimes venue expense | Often omitted or wrong |
| **Withholding** | State rate × artist payout (non-resident) | State-specific; sometimes forgotten |

**Reality:** Most settlements are done in Excel or Google Sheets. Someone has a template. They copy last week's show, change the numbers, and hope nothing breaks. Rounding is inconsistent. A formula might reference the wrong cell. Nobody recalculates from scratch.

---

## 4. Where Disputes Commonly Happen

| Dispute Zone | Typical Argument | Why It Happens |
|--------------|------------------|----------------|
| **Expenses** | "We never agreed to that." / "That's in the rider." | Single line item; no itemization; rider vs. venue-imposed |
| **Comps** | "Those comps shouldn't reduce our gross." | Contract may say "comps don't count" or "house comps don't count" |
| **Gross vs. net** | "85% of adjusted gross" vs. "85% of net" | Contract language ambiguous |
| **CC fees** | "That comes off the top." / "That's your cost." | Rarely in contract; venue usually eats it or negotiates |
| **Service fees** | "We get gross before fees." / "Fees are part of gross." | Ticketing system keeps a cut; contract may not specify |
| **Merch** | "Your count is wrong." / "We had more inventory." | Cash handling; no formal count; different numbers |
| **Deposit** | "We never got the deposit." / "That was for a different show." | Wire timing; multi-show runs |
| **Withholding** | "We're not subject to that." / "You didn't tell us." | State rules; artist residency; last-minute surprise |
| **Buyouts** | "Catering was a buyout, not an expense." | Rider says "artist receives $X buyout" — reduces balance vs. expense |
| **Rounding** | "Your numbers don't add up." | Floating point; inconsistent rounding; formula errors |

**Reality:** Disputes often get "resolved" by one side conceding to keep the bus moving. The tour manager has a 6am lobby call. The venue wants to lock the doors. Small discrepancies ($50–$200) get eaten. Big ones get deferred: "We'll sort it Monday."

---

## 5. Time-Sensitive Steps

| Step | Why It's Time-Sensitive |
|------|--------------------------|
| **Settlement before artist leaves** | Tour manager is the signatory; once they're on the bus, you're chasing them for weeks |
| **Merch count** | Must happen before merch is packed; once it's in the truck, the number is disputed forever |
| **Expense verification** | Receipts need to be gathered before crew leaves; production manager may be gone by midnight |
| **Ticket report** | Box office may close; report might not be final until next day for some systems |
| **Payment** | Contract often says "payment at settlement" — check or wire that night; delay = breach |
| **Countersignature** | Tour manager signs; if they leave without signing, you have no proof of agreement |

**Reality:** The settlement often happens between 12:30am and 2:30am. The show ended at 11. Load-out takes 1–2 hours. Everyone is tired. The ticket report might not be ready. Someone runs to the office to print it. The tour manager is checking their watch.

---

## 6. What Happens Late at Night Under Fatigue or Pressure

| Behavior | Consequence |
|----------|-------------|
| **Skipping itemization** | "Let's just put $4,200 for expenses." — Dispute later; no audit trail |
| **Trusting the wrong number** | Ticket report says 347; someone typed 374 — wrong gross |
| **Forgetting the deposit** | Artist gets overpaid; venue has to claw back |
| **Wrong deal structure** | "I thought it was guarantee vs. percentage." — Entire payout wrong |
| **No countersignature** | Tour manager leaves; venue has no proof artist agreed |
| **Rounding errors** | Numbers don't add up; loss of confidence; redo from scratch |
| **Copy-paste from last week** | Last week was a different deal; formulas break |
| **Merch number from memory** | "I think it was around $2,000." — Should be counted |
| **Deferring disputes** | "We'll fix it later." — Later never comes; bad blood |
| **Paying without signed sheet** | No proof of agreement; artist could claim different terms |

**Reality:** The best settlements happen when both parties are prepared: numbers pre-entered, deal memo on the table, template ready. The worst happen when the venue is scrambling, the tour manager is exhausted, and nobody has the contract. Speed and fatigue favor errors. The goal of any tool is to reduce cognitive load and eliminate manual math at 1am.

---

## 7. End-to-End Flow (Messy Version)

```
WEEKS BEFORE
├── Deal memo signed (guarantee, %, deposit schedule)
├── Rider exchanged (tech, hospitality, buyouts)
└── Advance call (comp list, load-in, set times)

DAY OF SHOW
├── Load-in (production manager, crew)
├── Soundcheck
├── Doors open (box office, security, head count)
├── Show
└── Load-out (crew, production manager may leave)

POST-SHOW (12am–2:30am)
├── Box office: reconcile till, get ticket report (or wait for it)
├── Production: gather expense receipts, hand to venue
├── Merch: count inventory, report gross (or napkin)
├── Venue accountant: start settlement sheet
├── Tour manager: available for 1–2 hours max
├── Settlement meeting:
│   ├── Compare ticket report to settlement
│   ├── Review expenses (disputes here)
│   ├── Apply deal structure
│   ├── Subtract deposit, withholding, buyouts
│   ├── Agree on balance due
│   └── Both parties sign (or acknowledge)
└── Payment: check or wire that night / next day

DAYS AFTER
├── Venue: file withholding, send 1099 if applicable
├── Tour manager: send settlement to artist's accountant
└── Disputes: "We need to fix that $200" — sometimes resolved, sometimes not
```

---

## 8. Summary: What the Real World Needs

1. **Itemized expenses** — The #1 dispute source. Every dollar must be visible and attributable.
2. **Deal structure clarity** — Guarantee vs. %, guarantee + back-end, door deal — no ambiguity.
3. **Deposit and balance due** — "Balance due tonight" is the number that matters.
4. **Merch as separate** — Often settled at same time; needs its own section.
5. **Countersignature / acknowledgment** — Proof that both parties agreed.
6. **Speed and simplicity** — Must work at 1am when everyone is tired.
7. **Reconciliation to ticket report** — Gross must match ticketing system; manual entry invites error.
8. **Notes and dispute capture** — "Artist disputes $200 security" — document it, don't hide it.
9. **Rounding and consistency** — Numbers must add up; no floating-point surprises.
10. **Audit trail** — Who entered what, when — for when "we'll fix it Monday" becomes a lawsuit.

---

*Next: Part 2 will compare this workflow to what the application currently supports.*
