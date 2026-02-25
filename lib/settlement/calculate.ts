/**
 * Settlement calculation logic — shared between client and server.
 * Server-side recalculation on save ensures results always match inputs.
 */

export type DealType =
  | "guarantee"
  | "percentage"
  | "guarantee_vs_percentage"
  | "guarantee_plus_percentage"
  | "percentage_of_gross"
  | "door_deal";

export interface TicketTierInput {
  id?: string;
  name: string;
  price: string;
  sold: string;
  comps?: string;
}

export interface ExpenseItemInput {
  id?: string;
  label: string;
  amount: string;
  note?: string;
}

export interface BuyoutItemInput {
  id?: string;
  label: string;
  amount: string;
}

export interface ArtistDealInput {
  id?: string;
  artistName: string;
  dealType: DealType;
  guarantee: string;
  percentage: string;
  breakeven: string;
  deposit: string;
  withholdingRate: string;
  withholdingState: string;
  buyoutItems: BuyoutItemInput[];
  buyoutMode: string;
}

export interface CalculationInput {
  showName: string;
  showDate?: string;
  ticketTiers: TicketTierInput[];
  capacity: string;
  taxRate: string;
  taxMode: string;
  ccFeeRate: string;
  ccFeeMode: string;
  expenseItems: ExpenseItemInput[];
  artists: ArtistDealInput[];
  merchGross: string;
  merchVenuePercent: string;
  notes: string;
}

export interface ArtistCalcResult {
  artistName: string;
  dealType: string;
  artistPayout: number;
  overage?: number;
  breakeven?: number;
  withholdingAmount?: number;
  withholdingState?: string;
  buyoutItems?: { label: string; amount: number }[];
  totalBuyouts?: number;
  deposit: number;
  balanceDue: number;
}

export interface CalculationResult {
  grossRevenue: number;
  ticketTiers?: { name: string; price: number; sold: number; comps: number; revenue: number }[];
  totalTicketsSold?: number;
  totalComps?: number;
  taxAmount: number;
  totalExpenses: number;
  expenseItems?: { label: string; amount: number; note?: string }[];
  netProfit: number;
  notes?: string;
  artists: ArtistCalcResult[];
  artistPayout: number;
  overage?: number;
  breakeven?: number;
  ccFees?: number;
  withholdingAmount?: number;
  withholdingState?: string;
  buyoutItems?: { label: string; amount: number }[];
  totalBuyouts?: number;
  deposit: number;
  balanceDue: number;
  venuePayout: number;
  merchGross?: number;
  merchVenueCut?: number;
  merchNetToArtist?: number;
  totalDueToArtist?: number;
  calculatedAt?: string;
  acknowledgments?: { name: string; email: string; timestamp: string }[];
}

export type ComputeOutput =
  | { ok: true; result: CalculationResult; warnings: string[] }
  | { ok: false; error: string };

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function warnIfNotNumeric(value: string, fieldName: string, warnings: string[]) {
  const trimmed = value.trim();
  if (trimmed && isNaN(parseFloat(trimmed))) {
    warnings.push(`"${fieldName}" contains "${trimmed}" — treated as 0.`);
  }
}

function computeArtistDealPayout(
  dealType: DealType,
  guarantee: number,
  percentage: number,
  breakevenInput: number,
  netProfit: number,
  grossRevenue: number,
  taxAmount: number,
  totalExpenses: number
): { artistPayout: number; overage?: number; breakeven?: number } {
  let artistPayout: number;
  let overage: number | undefined;
  let breakevenPoint: number | undefined;

  switch (dealType) {
    case "guarantee":
      artistPayout = guarantee;
      break;
    case "percentage":
      artistPayout = round2(Math.max(0, netProfit * (percentage / 100)));
      break;
    case "guarantee_vs_percentage": {
      const percentageShare = round2(Math.max(0, netProfit * (percentage / 100)));
      artistPayout = Math.max(guarantee, percentageShare);
      break;
    }
    case "guarantee_plus_percentage": {
      breakevenPoint = breakevenInput > 0 ? breakevenInput : round2(guarantee + totalExpenses);
      overage = round2(Math.max(0, (netProfit - breakevenPoint) * (percentage / 100)));
      artistPayout = round2(guarantee + overage);
      break;
    }
    case "percentage_of_gross":
      artistPayout = round2(Math.max(0, grossRevenue * (percentage / 100)));
      break;
    case "door_deal":
      artistPayout = round2(Math.max(0, (grossRevenue - taxAmount) * (percentage / 100)));
      break;
    default:
      artistPayout = 0;
  }

  return { artistPayout, overage, breakeven: breakevenPoint };
}

export function computeSettlement(data: CalculationInput): ComputeOutput {
  const warnings: string[] = [];
  const taxRate = parseNumber(data.taxRate);
  const ccFeeRate = parseNumber(data.ccFeeRate);
  const ccOffTop = data.ccFeeMode === "off_top";
  const taxIsInclusive = data.taxMode === "inclusive";

  warnIfNotNumeric(data.taxRate, "Tax Rate", warnings);
  warnIfNotNumeric(data.ccFeeRate, "CC Fee Rate", warnings);

  const parsedTiers = data.ticketTiers
    .filter((t) => parseNumber(t.price) > 0 || parseNumber(t.sold) > 0)
    .map((t) => {
      warnIfNotNumeric(t.price, `${t.name || "Tier"} Price`, warnings);
      warnIfNotNumeric(t.sold, `${t.name || "Tier"} Tickets Sold`, warnings);
      const price = round2(parseNumber(t.price));
      const sold = parseNumber(t.sold);
      const comps = parseNumber(t.comps ?? "0");
      return { name: t.name.trim() || "General Admission", price, sold, comps, revenue: round2(price * sold) };
    });

  const totalTicketsSold = parsedTiers.reduce((sum, t) => sum + t.sold, 0);
  const totalComps = parsedTiers.reduce((sum, t) => sum + t.comps, 0);
  const grossRevenue = round2(parsedTiers.reduce((sum, t) => sum + t.revenue, 0));

  const capacity = parseNumber(data.capacity);
  if (capacity > 0 && totalTicketsSold > capacity) {
    warnings.push(`Tickets sold (${totalTicketsSold}) exceeds capacity (${capacity}). Verify numbers.`);
  }
  for (const t of parsedTiers) {
    if (t.comps > t.sold) {
      warnings.push(`${t.name}: Comps (${t.comps}) exceeds sold (${t.sold}). Verify numbers.`);
    }
  }
  if (totalComps > totalTicketsSold) {
    warnings.push(`Total comps (${totalComps}) exceeds total sold (${totalTicketsSold}). Verify numbers.`);
  }

  const parsedExpenseItems = data.expenseItems
    .filter((item) => item.label.trim() || parseNumber(item.amount) > 0)
    .map((item) => {
      warnIfNotNumeric(item.amount, `Expense "${item.label.trim() || "Unlabeled"}"`, warnings);
      const amt = round2(parseNumber(item.amount));
      if (amt < 0) {
        warnings.push(`Expense "${item.label.trim() || "Unlabeled"}" has negative amount. Verify numbers.`);
      }
      return {
        label: item.label.trim() || "Unlabeled Expense",
        amount: amt,
        ...(item.note?.trim() ? { note: item.note.trim() } : {}),
      };
    });

  let totalExpenses = round2(parsedExpenseItems.reduce((sum, item) => sum + item.amount, 0));

  for (const artist of data.artists) {
    if (artist.buyoutMode === "show_expense") {
      for (const b of artist.buyoutItems) {
        if (b.label.trim() || parseNumber(b.amount) > 0) {
          const amt = round2(parseNumber(b.amount));
          if (amt > 0) totalExpenses = round2(totalExpenses + amt);
        }
      }
    }
  }

  if (parsedTiers.length === 0 || grossRevenue <= 0) {
    return { ok: false, error: "Please enter at least one ticket tier with a valid price and quantity sold." };
  }

  const taxAmount = taxIsInclusive
    ? round2((grossRevenue * taxRate) / (100 + taxRate))
    : round2(grossRevenue * (taxRate / 100));
  const ccFees = ccFeeRate > 0 ? round2(grossRevenue * (ccFeeRate / 100)) : 0;
  const netProfit = ccOffTop
    ? round2(grossRevenue - taxAmount - ccFees - totalExpenses)
    : round2(grossRevenue - taxAmount - totalExpenses);

  const artistResults: ArtistCalcResult[] = [];

  for (const artist of data.artists) {
    const aName = artist.artistName.trim() || `Artist ${data.artists.indexOf(artist) + 1}`;
    const guarantee = round2(parseNumber(artist.guarantee));
    const percentage = parseNumber(artist.percentage);

    warnIfNotNumeric(artist.guarantee, `${aName} Guarantee`, warnings);
    warnIfNotNumeric(artist.percentage, `${aName} Percentage`, warnings);
    warnIfNotNumeric(artist.deposit, `${aName} Deposit`, warnings);
    warnIfNotNumeric(artist.withholdingRate, `${aName} Withholding Rate`, warnings);
    warnIfNotNumeric(artist.breakeven, `${aName} Breakeven`, warnings);

    if (artist.dealType === "guarantee" && guarantee <= 0) {
      return { ok: false, error: `${aName}: Please enter a valid guarantee amount.` };
    }
    if (
      (artist.dealType === "percentage" ||
        artist.dealType === "percentage_of_gross" ||
        artist.dealType === "door_deal") &&
      percentage <= 0
    ) {
      return { ok: false, error: `${aName}: Please enter a valid percentage.` };
    }
    if (artist.dealType === "guarantee_vs_percentage" && (guarantee <= 0 || percentage <= 0)) {
      return { ok: false, error: `${aName}: Please enter both guarantee amount and percentage.` };
    }
    if (artist.dealType === "guarantee_plus_percentage" && (guarantee <= 0 || percentage <= 0)) {
      return { ok: false, error: `${aName}: Please enter both guarantee amount and back-end percentage.` };
    }

    const breakevenInput = round2(parseNumber(artist.breakeven));
    const { artistPayout, overage, breakeven: bk } = computeArtistDealPayout(
      artist.dealType,
      guarantee,
      percentage,
      breakevenInput,
      netProfit,
      grossRevenue,
      taxAmount,
      totalExpenses
    );

    const parsedBuyoutItems = artist.buyoutItems
      .filter((item) => item.label.trim() || parseNumber(item.amount) > 0)
      .map((item) => {
        warnIfNotNumeric(item.amount, `${aName} Buyout "${item.label.trim() || "Unlabeled"}"`, warnings);
        const amt = round2(parseNumber(item.amount));
        if (amt < 0) {
          warnings.push(`${aName} Buyout "${item.label.trim() || "Unlabeled"}" has negative amount. Verify numbers.`);
        }
        return { label: item.label.trim() || "Unlabeled Buyout", amount: amt };
      });
    const totalBuyouts = round2(parsedBuyoutItems.reduce((s, i) => s + i.amount, 0));

    const whRate = parseNumber(artist.withholdingRate);
    const withholdingAmount = whRate > 0 ? round2(artistPayout * (whRate / 100)) : 0;
    const deposit = round2(parseNumber(artist.deposit));
    const buyoutDeduction = artist.buyoutMode !== "show_expense" && totalBuyouts > 0 ? totalBuyouts : 0;
    const balanceDue = round2(artistPayout - deposit - withholdingAmount - buyoutDeduction);

    artistResults.push({
      artistName: aName,
      dealType: artist.dealType,
      artistPayout,
      overage,
      breakeven: bk,
      withholdingAmount: withholdingAmount > 0 ? withholdingAmount : undefined,
      withholdingState: withholdingAmount > 0 && artist.withholdingState?.trim() ? artist.withholdingState.trim() : undefined,
      buyoutItems: parsedBuyoutItems.length > 0 ? parsedBuyoutItems : undefined,
      totalBuyouts: totalBuyouts > 0 ? totalBuyouts : undefined,
      deposit,
      balanceDue,
    });
  }

  const totalArtistPayouts = round2(artistResults.reduce((s, a) => s + a.artistPayout, 0));
  const totalDeposits = round2(artistResults.reduce((s, a) => s + a.deposit, 0));
  const totalBalanceDue = round2(artistResults.reduce((s, a) => s + a.balanceDue, 0));
  const first = artistResults[0];

  const venuePayout = ccOffTop
    ? round2(netProfit - totalArtistPayouts)
    : round2(netProfit - totalArtistPayouts - ccFees);

  const merchGross = round2(parseNumber(data.merchGross));
  const merchVenuePercent = parseNumber(data.merchVenuePercent);
  warnIfNotNumeric(data.merchGross, "Merch Gross Sales", warnings);
  warnIfNotNumeric(data.merchVenuePercent, "Venue Merch %", warnings);
  const merchVenueCut = merchGross > 0 ? round2(merchGross * (merchVenuePercent / 100)) : 0;
  const merchNetToArtist = round2(merchGross - merchVenueCut);
  const totalDueToArtist =
    merchGross > 0 && artistResults.length === 1 ? round2(first.balanceDue + merchNetToArtist) : undefined;

  if (venuePayout < 0) {
    warnings.push("Venue payout is negative — the house is taking a loss on this show.");
  }

  for (const ar of artistResults) {
    if (ar.balanceDue < 0) {
      warnings.push(
        `${ar.artistName}: Artist owes ${formatCurrency(Math.abs(ar.balanceDue))} back to promoter (deposit exceeded payout).`
      );
    }
  }

  return {
    ok: true,
    result: {
      grossRevenue,
      ticketTiers: parsedTiers,
      totalTicketsSold,
      totalComps,
      taxAmount,
      totalExpenses,
      expenseItems: parsedExpenseItems,
      netProfit,
      artists: artistResults,
      artistPayout: totalArtistPayouts,
      overage: first?.overage,
      breakeven: first?.breakeven,
      ccFees: ccFees > 0 ? ccFees : undefined,
      withholdingAmount: first?.withholdingAmount,
      withholdingState: first?.withholdingState,
      buyoutItems: first?.buyoutItems,
      totalBuyouts: first?.totalBuyouts,
      deposit: totalDeposits,
      balanceDue: totalBalanceDue,
      venuePayout,
      merchGross: merchGross > 0 ? merchGross : undefined,
      merchVenueCut: merchGross > 0 ? merchVenueCut : undefined,
      merchNetToArtist: merchGross > 0 ? merchNetToArtist : undefined,
      totalDueToArtist,
      notes: data.notes?.trim() || undefined,
      calculatedAt: new Date().toISOString(),
    },
    warnings,
  };
}
