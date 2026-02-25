"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu, type AppAccountMenuData } from "@/components/ui/AppAccountMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import SharePopover from "./components/SharePopover";
import { computeSettlement, formatCurrency, parseNumber, round2 } from "@/lib/settlement/calculate";
import "./calculator.css";

type DealType = "guarantee" | "percentage" | "guarantee_vs_percentage" | "guarantee_plus_percentage" | "percentage_of_gross" | "door_deal";

interface TicketTier {
  id: string;
  name: string;
  price: string;
  sold: string;
  comps: string;
}

interface ExpenseItem {
  id: string;
  label: string;
  amount: string;
  note?: string;
}

interface BuyoutItem {
  id: string;
  label: string;
  amount: string;
}

const COMMON_BUYOUTS = [
  "Catering Buyout",
  "Hotel / Accommodation",
  "Production Buyout",
  "Ground Transport",
  "Backline Buyout",
];

const COMMON_EXPENSES = [
  "Sound",
  "Lights",
  "Security",
  "Catering / Hospitality",
  "Backline Rental",
  "Stagehands",
  "Insurance",
  "Marketing / Advertising",
  "ASCAP / BMI / SESAC",
  "Ticket Printing",
  "Runner / Transport",
];

interface ArtistDeal {
  id: string;
  artistName: string;
  dealType: DealType;
  guarantee: string;
  percentage: string;
  breakeven: string;
  deposit: string;
  withholdingRate: string;
  withholdingState: string;
  buyoutItems: BuyoutItem[];
  buyoutMode: string;
}

interface FormData {
  showName: string;
  showDate: string;
  expectedGross: string;
  ticketTiers: TicketTier[];
  capacity: string;
  taxRate: string;
  taxMode: string;
  ccFeeRate: string;
  ccFeeMode: string;
  expenseItems: ExpenseItem[];
  artists: ArtistDeal[];
  merchGross: string;
  merchVenuePercent: string;
  notes: string;
}

interface ArtistCalcResult {
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

interface Acknowledgment {
  name: string;
  email: string;
  timestamp: string;
}

interface CalculationResult {
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
  acknowledgments?: Acknowledgment[];
}

export interface CalculatorContentProps {
  userId: string;
  userEmail: string;
  accountMenuData: AppAccountMenuData;
}

function getDealSummary(
  ar: ArtistCalcResult,
  fa: ArtistDeal | undefined,
  netProfit: number,
  grossRevenue: number,
  taxAmount: number
): string {
  const pct = fa?.percentage ? parseFloat(fa.percentage) : 0;
  const guar = fa?.guarantee ? parseFloat(fa.guarantee) : 0;
  switch (ar.dealType) {
    case "guarantee":
      return `Artist gets: ${formatCurrency(ar.artistPayout)} guarantee`;
    case "percentage":
      return `Artist gets: ${pct}% of net → ${formatCurrency(ar.artistPayout)}`;
    case "guarantee_vs_percentage": {
      const pctShare = round2(Math.max(0, netProfit * (pct / 100)));
      return `Artist gets: ${formatCurrency(guar)} guarantee OR ${pct}% of net (${formatCurrency(pctShare)}), whichever is higher → ${formatCurrency(ar.artistPayout)}`;
    }
    case "guarantee_plus_percentage":
      return `Artist gets: ${formatCurrency(guar)} guarantee + ${pct}% of net above breakeven → ${formatCurrency(ar.artistPayout)}`;
    case "percentage_of_gross":
      return `Artist gets: ${pct}% of gross → ${formatCurrency(ar.artistPayout)}`;
    case "door_deal":
      return `Artist gets: ${pct}% of gross after tax → ${formatCurrency(ar.artistPayout)}`;
    default:
      return `Artist gets: ${formatCurrency(ar.artistPayout)}`;
  }
}

function CalculatorInner({ userId, userEmail, accountMenuData }: CalculatorContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const tierIdCounter = useRef(2);
  const expenseIdCounter = useRef(2);
  const buyoutIdCounter = useRef(2);
  const artistIdCounter = useRef(2);

  function defaultArtist(id: string): ArtistDeal {
    return {
      id,
      artistName: "",
      dealType: "guarantee",
      guarantee: "",
      percentage: "",
      breakeven: "",
      deposit: "",
      withholdingRate: "",
      withholdingState: "",
      buyoutItems: [{ id: `${id}-b1`, label: "", amount: "" }],
      buyoutMode: "deduct_from_balance",
    };
  }

  const [formData, setFormData] = useState<FormData>({
    showName: "",
    showDate: "",
    expectedGross: "",
    ticketTiers: [{ id: "1", name: "General Admission", price: "", sold: "", comps: "" }],
    capacity: "",
    taxRate: "",
    taxMode: "exclusive",
    ccFeeRate: "",
    ccFeeMode: "expense",
    expenseItems: [{ id: "1", label: "", amount: "" }],
    artists: [defaultArtist("1")],
    merchGross: "",
    merchVenuePercent: "",
    notes: "",
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [resultsStale, setResultsStale] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentShowId, setCurrentShowId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    async function loadShow() {
      const showId = searchParams.get('showId');
      if (!showId) return;

      try {
        const { data, error } = await supabase
          .from('shows')
          .select('*')
          .eq('id', showId)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading show:', error);
          setSaveStatus('error');
          setSaveMessage('Failed to load show. It may not exist or you may not have access.');
          setTimeout(() => {
            setSaveMessage('');
            setSaveStatus('idle');
          }, 4000);
          return;
        }

        if (data) {
          let loadedTiers: TicketTier[];
          if (data.inputs.ticketTiers && data.inputs.ticketTiers.length > 0) {
            loadedTiers = data.inputs.ticketTiers.map(
              (t: { name: string; price: string; sold: string; comps?: string }, i: number) => ({
                id: String(i + 1),
                name: t.name || "",
                price: t.price || "",
                sold: t.sold || "",
                comps: t.comps || "",
              })
            );
          } else if (data.inputs.ticketPrice || data.inputs.ticketsSold) {
            loadedTiers = [{
              id: "1",
              name: "General Admission",
              price: data.inputs.ticketPrice || "",
              sold: data.inputs.ticketsSold || "",
              comps: "",
            }];
          } else {
            loadedTiers = [{ id: "1", name: "General Admission", price: "", sold: "", comps: "" }];
          }
          tierIdCounter.current = loadedTiers.length + 1;

          let loadedExpenseItems: ExpenseItem[];
          if (data.inputs.expenseItems && data.inputs.expenseItems.length > 0) {
            loadedExpenseItems = data.inputs.expenseItems.map(
              (item: { label: string; amount: string; note?: string }, i: number) => ({
                id: String(i + 1),
                label: item.label || "",
                amount: item.amount || "",
                note: item.note || "",
              })
            );
          } else if (data.inputs.totalExpenses) {
            loadedExpenseItems = [
              { id: "1", label: "Other Expenses", amount: data.inputs.totalExpenses },
            ];
          } else {
            loadedExpenseItems = [{ id: "1", label: "", amount: "" }];
          }
          expenseIdCounter.current = loadedExpenseItems.length + 1;

          let loadedArtists: ArtistDeal[];
          if (data.inputs.artists && data.inputs.artists.length > 0) {
            loadedArtists = data.inputs.artists.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (a: any, i: number) => {
                const aid = String(i + 1);
                const buyouts = a.buyoutItems && a.buyoutItems.length > 0
                  ? a.buyoutItems.map((b: { label: string; amount: string }, j: number) => ({
                      id: `${aid}-b${j + 1}`,
                      label: b.label || "",
                      amount: b.amount || "",
                    }))
                  : [{ id: `${aid}-b1`, label: "", amount: "" }];
                return {
                  id: aid,
                  artistName: a.artistName || "",
                  dealType: a.dealType || "guarantee",
                  guarantee: a.guarantee || "",
                  percentage: a.percentage || "",
                  breakeven: a.breakeven || "",
                  deposit: a.deposit || "",
                  withholdingRate: a.withholdingRate || "",
                  withholdingState: a.withholdingState || "",
                  buyoutItems: buyouts,
                  buyoutMode: a.buyoutMode || "deduct_from_balance",
                };
              }
            );
          } else {
            const buyouts = data.inputs.buyoutItems && data.inputs.buyoutItems.length > 0
              ? data.inputs.buyoutItems.map(
                  (item: { label: string; amount: string }, i: number) => ({
                    id: `1-b${i + 1}`,
                    label: item.label || "",
                    amount: item.amount || "",
                  })
                )
              : [{ id: "1-b1", label: "", amount: "" }];
            loadedArtists = [{
              id: "1",
              artistName: data.inputs.artistName || "",
              dealType: data.inputs.dealType || "guarantee",
              guarantee: data.inputs.guarantee || "",
              percentage: data.inputs.percentage || "",
              breakeven: data.inputs.breakeven || "",
              deposit: data.inputs.deposit || "",
              withholdingRate: data.inputs.withholdingRate || "",
              withholdingState: data.inputs.withholdingState || "",
              buyoutItems: buyouts,
              buyoutMode: data.inputs.buyoutMode || "deduct_from_balance",
            }];
          }
          artistIdCounter.current = loadedArtists.length + 1;
          let maxBuyoutId = 0;
          for (const a of loadedArtists) {
            maxBuyoutId = Math.max(maxBuyoutId, a.buyoutItems.length);
          }
          buyoutIdCounter.current = maxBuyoutId + 1;

          const showDateValue = data.show_date
            ? new Date(data.show_date).toISOString().slice(0, 10)
            : '';
          setFormData({
            showName: data.title || '',
            showDate: showDateValue,
            expectedGross: data.inputs.expectedGross || '',
            ticketTiers: loadedTiers,
            capacity: data.inputs.capacity || '',
            taxRate: data.inputs.taxRate || '',
            taxMode: data.inputs.taxMode || 'exclusive',
            ccFeeRate: data.inputs.ccFeeRate || '',
            ccFeeMode: data.inputs.ccFeeMode || 'expense',
            expenseItems: loadedExpenseItems,
            artists: loadedArtists,
            merchGross: data.inputs.merchGross || '',
            merchVenuePercent: data.inputs.merchVenuePercent || '',
            notes: data.inputs.notes || '',
          });
          setResult(data.results);
          setCurrentShowId(data.id);
        }
      } catch (error) {
        console.error('Error loading show:', error);
      }
    }

    loadShow();
  }, [searchParams, userId, supabase]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
  }

  function addTicketTier() {
    const id = String(tierIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      ticketTiers: [...prev.ticketTiers, { id, name: "", price: "", sold: "", comps: "" }],
    }));
    if (result) setResultsStale(true);
  }

  function removeTicketTier(id: string) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((tier) => tier.id !== id),
    }));
    if (result) setResultsStale(true);
  }

  function updateTicketTier(id: string, field: keyof Omit<TicketTier, "id">, value: string) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
  }

  function addExpenseItem() {
    const id = String(expenseIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      expenseItems: [...prev.expenseItems, { id, label: "", amount: "" }],
    }));
    if (result) setResultsStale(true);
  }

  function removeExpenseItem(id: string) {
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.filter((item) => item.id !== id),
    }));
    if (result) setResultsStale(true);
  }

  function updateExpenseItem(id: string, field: "label" | "amount" | "note", value: string) {
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
  }

  function addArtist() {
    const id = String(artistIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      artists: [...prev.artists, defaultArtist(id)],
    }));
    if (result) setResultsStale(true);
  }

  function removeArtist(artistId: string) {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.filter((a) => a.id !== artistId),
    }));
    if (result) setResultsStale(true);
  }

  function updateArtistField(artistId: string, field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId ? { ...a, [field]: value } : a
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
  }

  function addArtistBuyoutItem(artistId: string) {
    const id = String(buyoutIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId
          ? { ...a, buyoutItems: [...a.buyoutItems, { id, label: "", amount: "" }] }
          : a
      ),
    }));
    if (result) setResultsStale(true);
  }

  function removeArtistBuyoutItem(artistId: string, buyoutId: string) {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId
          ? { ...a, buyoutItems: a.buyoutItems.filter((b) => b.id !== buyoutId) }
          : a
      ),
    }));
    if (result) setResultsStale(true);
  }

  function updateArtistBuyoutItem(artistId: string, buyoutId: string, field: "label" | "amount", value: string) {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId
          ? { ...a, buyoutItems: a.buyoutItems.map((b) => b.id === buyoutId ? { ...b, [field]: value } : b) }
          : a
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
  }

  function handleCalculate() {
    const output = computeSettlement(formData);
    if (!output.ok) {
      setErrorMessage(output.error);
      setResult(null);
      setWarnings([]);
      return;
    }
    const warnings = [...output.warnings];
    const expectedGross = parseNumber(formData.expectedGross);
    if (expectedGross > 0 && Math.abs(output.result.grossRevenue - expectedGross) > 0.01) {
      warnings.push(
        `Calculated gross (${formatCurrency(output.result.grossRevenue)}) differs from expected (${formatCurrency(expectedGross)}). Verify ticket report.`
      );
    }
    setResult(output.result);
    setWarnings(warnings);
    setResultsStale(false);
    setErrorMessage("");
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    if (!result) return;

    const rows: ([] | [string, string])[] = [];
    if (formData.showName) rows.push(["Show", formData.showName]);
    if (formData.showDate) rows.push(["Show Date", formData.showDate]);
    const allArtistNames = (result.artists || []).map((a) => a.artistName).filter(Boolean).join(", ");
    if (allArtistNames) rows.push(["Artist(s)", allArtistNames]);
    rows.push([]);

    if (result.ticketTiers && result.ticketTiers.length > 1) {
      for (const tier of result.ticketTiers) {
        rows.push([`${tier.name} (${tier.sold} × ${formatCurrency(tier.price)})`, formatCurrency(tier.revenue)]);
      }
    }
    const ticketsSoldNote = result.totalTicketsSold
      ? ` (${result.totalTicketsSold} sold${result.totalComps ? `, ${result.totalComps} comps` : ""})`
      : "";
    rows.push([`Gross Revenue${ticketsSoldNote}`, formatCurrency(result.grossRevenue)]);

    const taxLabel = `Tax (${formData.taxRate || "0"}%${formData.taxMode === "inclusive" ? ", included in price" : ""})`;
    rows.push([taxLabel, `−${formatCurrency(result.taxAmount)}`]);

    if (result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === "off_top") {
      rows.push([`CC Processing Fees (${formData.ccFeeRate}%)`, `−${formatCurrency(result.ccFees)}`]);
    }

    if (result.notes) {
      rows.push(["Notes", result.notes]);
      rows.push([]);
    }

    if (result.expenseItems && result.expenseItems.length > 0) {
      for (const item of result.expenseItems) {
        const label = item.note ? `${item.label} [${item.note}]` : item.label;
        rows.push([label, `−${formatCurrency(item.amount)}`]);
      }
      const allExpenseBuyouts = (result.artists || []).flatMap((a) =>
        a.dealType && formData.artists.find((fa) => fa.artistName === a.artistName)?.buyoutMode === "show_expense"
          ? (a.buyoutItems || []) : []
      );
      for (const item of allExpenseBuyouts) {
        rows.push([`${item.label} (buyout)`, `−${formatCurrency(item.amount)}`]);
      }
      if (result.expenseItems.length > 1 || allExpenseBuyouts.length > 0) {
        rows.push(["Total Expenses", `−${formatCurrency(result.totalExpenses)}`]);
      }
    } else {
      rows.push(["Expenses", `−${formatCurrency(result.totalExpenses)}`]);
    }

    rows.push(["Net", formatCurrency(result.netProfit)]);

    for (const ar of (result.artists || [])) {
      const fa = formData.artists.find((a) => a.artistName === ar.artistName || a.id === formData.artists[(result.artists || []).indexOf(ar)]?.id);
      rows.push([]);
      if ((result.artists || []).length > 1) rows.push([`--- ${ar.artistName} ---`, ""]);

      if (ar.overage != null && ar.breakeven != null) {
        rows.push(["Guarantee", formatCurrency(ar.artistPayout - ar.overage)]);
        rows.push(["Breakeven Point", formatCurrency(ar.breakeven)]);
        rows.push(["Back-End Overage", formatCurrency(ar.overage)]);
      }

      let artistLabel = "Artist Payout";
      if (ar.overage != null) artistLabel += " (Guarantee + Overage)";
      if (ar.dealType === "percentage_of_gross") artistLabel += ` (${fa?.percentage || ""}% of Gross)`;
      if (ar.dealType === "door_deal") artistLabel += ` (${fa?.percentage || ""}% of Gross After Tax)`;
      rows.push([artistLabel, formatCurrency(ar.artistPayout)]);

      if (ar.withholdingAmount != null && ar.withholdingAmount > 0) {
        const whLabel = `Withholding Tax (${fa?.withholdingRate || ""}%${ar.withholdingState ? `, ${ar.withholdingState}` : ""})`;
        rows.push([whLabel, `−${formatCurrency(ar.withholdingAmount)}`]);
      }
      if (ar.buyoutItems && ar.buyoutItems.length > 0 && fa?.buyoutMode === "deduct_from_balance") {
        for (const item of ar.buyoutItems) {
          rows.push([item.label, `−${formatCurrency(item.amount)}`]);
        }
      }
      if (ar.deposit > 0) {
        rows.push(["Deposit Paid", `−${formatCurrency(ar.deposit)}`]);
      }
      const hasDeductions = ar.deposit > 0 || (ar.withholdingAmount != null && ar.withholdingAmount > 0) || (ar.totalBuyouts != null && ar.totalBuyouts > 0 && fa?.buyoutMode === "deduct_from_balance");
      if (hasDeductions) {
        const balanceLabel = ar.balanceDue < 0
          ? "Overpayment (due back to promoter)"
          : "Balance Due at Settlement";
        rows.push([balanceLabel, formatCurrency(Math.abs(ar.balanceDue))]);
      }
    }

    rows.push([]);
    if (result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === "expense") {
      rows.push([`CC Processing Fees (${formData.ccFeeRate}%, venue cost)`, `−${formatCurrency(result.ccFees)}`]);
    }

    const venueLabel = result.venuePayout < 0 ? "Venue Loss" : "Promoter/House Settlement";
    const venueValue = result.venuePayout < 0
      ? `−${formatCurrency(Math.abs(result.venuePayout))}`
      : formatCurrency(result.venuePayout);
    rows.push([venueLabel, venueValue]);

    if (result.merchGross != null && result.merchGross > 0) {
      rows.push([]);
      rows.push(["Gross Merch Sales", formatCurrency(result.merchGross)]);
      rows.push([`Venue Merch Cut (${formData.merchVenuePercent || "0"}%)`, `−${formatCurrency(result.merchVenueCut ?? 0)}`]);
      rows.push(["Net Merch to Artist", formatCurrency(result.merchNetToArtist ?? 0)]);
      if (result.totalDueToArtist != null) {
        rows.push([]);
        rows.push(["Total Due to Artist", formatCurrency(result.totalDueToArtist)]);
      }
    }

    if (result.acknowledgments && result.acknowledgments.length > 0) {
      rows.push([]);
      for (const ack of result.acknowledgments) {
        const ackStr = ack.email ? `${ack.name} (${ack.email})` : ack.name;
        rows.push(["Acknowledged by", `${ackStr} on ${new Date(ack.timestamp).toLocaleString()}`]);
      }
    }

    const csvContent = rows
      .map((row) => row.length === 0 ? "" : row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = formData.showName
      ? `${formData.showName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}-settlement.csv`
      : "settlement.csv";
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveShow() {
    if (!formData.showName.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please enter a show name before saving.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return;
    }

    const freshCalc = computeSettlement(formData);
    if (!freshCalc.ok) {
      setSaveStatus('error');
      setSaveMessage('Cannot save: ' + freshCalc.error);
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return;
    }

    setResult(freshCalc.result);
    setWarnings(freshCalc.warnings);
    setResultsStale(false);

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      const inputs = {
        artists: formData.artists.map((a) => ({
          artistName: a.artistName,
          dealType: a.dealType,
          guarantee: a.guarantee,
          percentage: a.percentage,
          breakeven: a.breakeven,
          deposit: a.deposit,
          withholdingRate: a.withholdingRate,
          withholdingState: a.withholdingState,
          buyoutItems: a.buyoutItems.map(({ label, amount }) => ({ label, amount })),
          buyoutMode: a.buyoutMode,
        })),
        artistName: formData.artists[0]?.artistName || "",
        dealType: formData.artists[0]?.dealType || "guarantee",
        guarantee: formData.artists[0]?.guarantee || "",
        percentage: formData.artists[0]?.percentage || "",
        breakeven: formData.artists[0]?.breakeven || "",
        deposit: formData.artists[0]?.deposit || "",
        withholdingRate: formData.artists[0]?.withholdingRate || "",
        withholdingState: formData.artists[0]?.withholdingState || "",
        buyoutItems: formData.artists[0]?.buyoutItems.map(({ label, amount }) => ({ label, amount })) || [],
        buyoutMode: formData.artists[0]?.buyoutMode || "deduct_from_balance",
        ticketTiers: formData.ticketTiers.map(({ name, price, sold, comps }) => ({ name, price, sold, comps })),
        capacity: formData.capacity,
        expectedGross: formData.expectedGross || undefined,
        ticketPrice: formData.ticketTiers[0]?.price || '',
        ticketsSold: String(formData.ticketTiers.reduce((sum, t) => sum + parseNumber(t.sold), 0)),
        taxRate: formData.taxRate,
        taxMode: formData.taxMode,
        ccFeeRate: formData.ccFeeRate,
        ccFeeMode: formData.ccFeeMode,
        expenseItems: formData.expenseItems.map(({ label, amount, note }) => ({ label, amount, ...(note ? { note } : {}) })),
        notes: formData.notes || undefined,
        totalExpenses: String(
          formData.expenseItems.reduce((sum, item) => sum + parseNumber(item.amount), 0)
        ),
        merchGross: formData.merchGross,
        merchVenuePercent: formData.merchVenuePercent,
      };

      const res = await fetch("/api/shows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: currentShowId ?? undefined,
          title: formData.showName.trim(),
          show_date: formData.showDate.trim() || null,
          inputs,
          acknowledgments: currentShowId && result?.acknowledgments?.length ? result.acknowledgments : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save");
      }

      if (!currentShowId) {
        setCurrentShowId(data.showId);
      }
      setSaveStatus('success');
      setSaveMessage(currentShowId ? 'Show updated successfully!' : 'Show saved successfully!');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
    } catch (error) {
      console.error('Error saving show:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save show. Please try again.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
    }
  }

  return (
    <AppShell
      maxWidth={720}
      userEmail={userEmail}
      showNavLinks={false}
      userMenuContent={<AppAccountMenu initialData={accountMenuData} />}
    >
      <div className="calculator-container">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="ghost"
          size="sm"
          style={{ marginBottom: "1rem" }}
        >
          <Icon name="chevron" size={14} direction="left" /> Back to Dashboard
        </Button>

        <PageHeader
          title="Show Settlement Calculator"
          description="Quickly calculate artist and venue payouts for a live show. For small venues and indie promoters who are tired of broken spreadsheets. Plug in your show numbers and get a clean, consistent settlement breakdown."
          action={
            <div className="calculator-header-actions">
              <div className="calculator-header-actions-row ds-btn-group-equal">
                {result && (
                  <Button onClick={handleExportCSV} variant="ghost" size="sm">
                    Export CSV
                  </Button>
                )}
                <Button
                  onClick={handleSaveShow}
                  disabled={!result || saveStatus === 'saving' || (currentShowId != null && !resultsStale)}
                  variant="primary"
                  size="sm"
                  loading={saveStatus === 'saving'}
                >
                  {currentShowId ? 'Update Show' : 'Save Show'}
                </Button>
              </div>
              {currentShowId && result && (
                <div className="calculator-header-actions-row share-popover-row">
                  <SharePopover
                    showId={currentShowId}
                    showName={formData.showName}
                    resultsStale={resultsStale}
                    balanceDue={result.balanceDue}
                    totalDueToArtist={result.totalDueToArtist}
                  />
                </div>
              )}
            </div>
          }
        />

        {saveMessage && (
          <div className={`calculator-save-status ${saveStatus === 'success' ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}

        <Card className="calculator-form-section" variant="default" padding="lg">
          <h3 className="calculator-section-title">Show Info</h3>
          <Input id="showName" name="showName" label="Show Name" value={formData.showName} onChange={handleInputChange} placeholder="ex: Summer Festival 2026" />
          <Input id="showDate" name="showDate" label="Show Date" type="date" value={formData.showDate} onChange={handleInputChange} />

          <h3 className="calculator-section-title">Ticket Info</h3>
          <div className="calculator-tier-list">
            {formData.ticketTiers.map((tier, index) => (
              <div key={tier.id} className="calculator-tier-row">
                <Input
                  label={index === 0 ? "Tier Name" : undefined}
                  value={tier.name}
                  onChange={(e) => updateTicketTier(tier.id, "name", e.target.value)}
                  placeholder="ex: General Admission"
                />
                <Input
                  label={index === 0 ? "Price ($)" : undefined}
                  type="number"
                  value={tier.price}
                  onChange={(e) => updateTicketTier(tier.id, "price", e.target.value)}
                  placeholder="ex: 25"
                  min={0}
                  step={0.01}
                />
                <Input
                  label={index === 0 ? "Sold" : undefined}
                  type="number"
                  value={tier.sold}
                  onChange={(e) => updateTicketTier(tier.id, "sold", e.target.value)}
                  placeholder="ex: 200"
                  min={0}
                  step={1}
                />
                <Input
                  label={index === 0 ? "Comps" : undefined}
                  type="number"
                  value={tier.comps}
                  onChange={(e) => updateTicketTier(tier.id, "comps", e.target.value)}
                  placeholder="0"
                  min={0}
                  step={1}
                />
                {formData.ticketTiers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTicketTier(tier.id)}
                    aria-label={`Remove ${tier.name || "tier"}`}
                    className="calculator-tier-remove"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addTicketTier} type="button">
              + Add Tier
            </Button>
          </div>
          <Input
            id="capacity"
            name="capacity"
            label="Venue Capacity (optional)"
            type="number"
            value={formData.capacity}
            onChange={handleInputChange}
            placeholder="ex: 500"
            min={0}
            step={1}
          />
          <Input
            id="expectedGross"
            name="expectedGross"
            label="Expected gross from ticket report ($)"
            type="number"
            value={formData.expectedGross}
            onChange={handleInputChange}
            placeholder="Optional: verify against ticket report"
            min={0}
            step={0.01}
            hint="If provided, a warning appears when calculated gross differs"
          />

          <h3 className="calculator-section-title">Tax & Fees</h3>
          <div className="calculator-form-row">
            <Input id="taxRate" name="taxRate" label="Entertainment / Sales Tax (%)" type="number" value={formData.taxRate} onChange={handleInputChange} placeholder="ex: 10" min={0} max={100} step={0.1} hint="Amusement tax, sales tax, or venue tax rate" />
            <Select id="taxMode" name="taxMode" label="Tax Handling" value={formData.taxMode} onChange={handleInputChange}>
              <option value="exclusive">Tax added on top of ticket price</option>
              <option value="inclusive">Ticket prices already include tax</option>
            </Select>
          </div>
          <div className="calculator-form-row">
            <Input id="ccFeeRate" name="ccFeeRate" label="CC Processing Fee (%)" type="number" value={formData.ccFeeRate} onChange={handleInputChange} placeholder="ex: 2.9" min={0} max={100} step={0.01} hint="Credit card / payment processing rate" />
            <Select id="ccFeeMode" name="ccFeeMode" label="CC Fee Handling" value={formData.ccFeeMode} onChange={handleInputChange}>
              <option value="expense">Venue expense (does not reduce artist split)</option>
              <option value="off_top">Deducted from gross (shared cost)</option>
            </Select>
          </div>

          <h3 className="calculator-section-title">Show Expenses</h3>
          <div className="calculator-expense-list">
            {formData.expenseItems.map((item, index) => (
              <div key={item.id} className="calculator-expense-row">
                <Input
                  label={index === 0 ? "Expense" : undefined}
                  value={item.label}
                  onChange={(e) => updateExpenseItem(item.id, "label", e.target.value)}
                  placeholder="ex: Sound"
                  list="common-expenses"
                />
                <Input
                  label={index === 0 ? "Amount ($)" : undefined}
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateExpenseItem(item.id, "amount", e.target.value)}
                  placeholder="ex: 500"
                  min={0}
                  step={0.01}
                />
                {formData.expenseItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExpenseItem(item.id)}
                    aria-label={`Remove ${item.label || "expense"}`}
                    className="calculator-expense-remove"
                  >
                    ×
                  </Button>
                )}
                {(item.label.trim() || parseNumber(item.amount) > 0) && (
                  <div className="calculator-expense-note">
                    <input
                      className="ds-input ds-input-sm calculator-note-input"
                      value={item.note || ""}
                      onChange={(e) => updateExpenseItem(item.id, "note", e.target.value)}
                      placeholder="Add note (e.g., artist disputes this charge)"
                    />
                  </div>
                )}
              </div>
            ))}
            <datalist id="common-expenses">
              {COMMON_EXPENSES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <Button variant="ghost" size="sm" onClick={addExpenseItem} type="button">
              + Add Expense
            </Button>
          </div>

          {formData.artists.map((artist, artistIndex) => (
            <div key={artist.id} className="calculator-artist-section">
              <h3 className="calculator-section-title">
                {formData.artists.length > 1 ? `Artist ${artistIndex + 1} — Deal & Payouts` : "Artist — Deal & Payouts"}
                {formData.artists.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArtist(artist.id)}
                    aria-label={`Remove ${artist.artistName || `Artist ${artistIndex + 1}`}`}
                    style={{ marginLeft: "auto" }}
                  >
                    × Remove
                  </Button>
                )}
              </h3>

              <Input
                label="Artist / Band Name"
                value={artist.artistName}
                onChange={(e) => updateArtistField(artist.id, "artistName", e.target.value)}
                placeholder="ex: The Rolling Stones"
              />

              <Select
                label="Deal Type"
                value={artist.dealType}
                onChange={(e) => updateArtistField(artist.id, "dealType", e.target.value)}
              >
                <option value="guarantee" title="Artist receives a fixed amount regardless of show performance">Guarantee</option>
                <option value="percentage" title="Artist receives a percentage of net profit (after tax and expenses)">Percentage of Net</option>
                <option value="guarantee_vs_percentage" title="Artist gets the higher of: guarantee OR percentage of net">Guarantee vs Percentage (whichever is higher)</option>
                <option value="guarantee_plus_percentage" title="Artist gets guarantee plus a percentage of net above breakeven">Guarantee + Back-End Percentage</option>
                <option value="percentage_of_gross" title="Artist receives a percentage of gross revenue (before expenses)">Percentage of Gross (before deductions)</option>
                <option value="door_deal" title="Artist receives a percentage of gross after tax (no expenses deducted)">Door Deal (% of gross after tax)</option>
              </Select>

              <div className="calculator-form-row">
                {(artist.dealType === "guarantee" || artist.dealType === "guarantee_vs_percentage" || artist.dealType === "guarantee_plus_percentage") && (
                  <Input label="Guarantee Amount ($)" type="number" value={artist.guarantee} onChange={(e) => updateArtistField(artist.id, "guarantee", e.target.value)} placeholder="ex: 1000" min={0} step={0.01} />
                )}
                {(artist.dealType === "percentage" || artist.dealType === "guarantee_vs_percentage" || artist.dealType === "guarantee_plus_percentage" || artist.dealType === "percentage_of_gross" || artist.dealType === "door_deal") && (
                  <Input label={artist.dealType === "guarantee_plus_percentage" ? "Back-End Percentage (%)" : "Percentage (%)"} type="number" value={artist.percentage} onChange={(e) => updateArtistField(artist.id, "percentage", e.target.value)} placeholder="ex: 85" min={0} max={100} step={0.1} />
                )}
              </div>
              {artist.dealType === "guarantee_plus_percentage" && (
                <Input
                  label="Breakeven Point ($)"
                  type="number"
                  value={artist.breakeven}
                  onChange={(e) => updateArtistField(artist.id, "breakeven", e.target.value)}
                  placeholder="Leave blank to auto-calculate"
                  hint="Defaults to guarantee + total expenses if left blank"
                  min={0}
                  step={0.01}
                />
              )}

              <Input
                label="Deposit / Advance Already Paid ($)"
                type="number"
                value={artist.deposit}
                onChange={(e) => updateArtistField(artist.id, "deposit", e.target.value)}
                placeholder="ex: 500"
                hint="Amount already wired to the artist before the show"
                min={0}
                step={0.01}
              />

              <h4 className="calculator-subsection-title">Withholding & Buyouts (optional)</h4>
              <div className="calculator-form-row">
                <Input
                  label="Withholding Tax Rate (%)"
                  type="number"
                  value={artist.withholdingRate}
                  onChange={(e) => updateArtistField(artist.id, "withholdingRate", e.target.value)}
                  placeholder="ex: 7"
                  hint="State withholding for non-resident artists"
                  min={0}
                  max={100}
                  step={0.1}
                />
                <Input
                  label="Withholding State / Jurisdiction"
                  value={artist.withholdingState}
                  onChange={(e) => updateArtistField(artist.id, "withholdingState", e.target.value)}
                  placeholder="ex: CA, NY, IL"
                />
              </div>
              <div className="calculator-expense-list">
                {artist.buyoutItems.map((item, index) => (
                  <div key={item.id} className="calculator-expense-row">
                    <Input
                      label={index === 0 ? "Buyout" : undefined}
                      value={item.label}
                      onChange={(e) => updateArtistBuyoutItem(artist.id, item.id, "label", e.target.value)}
                      placeholder="ex: Catering Buyout"
                      list="common-buyouts"
                    />
                    <Input
                      label={index === 0 ? "Amount ($)" : undefined}
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateArtistBuyoutItem(artist.id, item.id, "amount", e.target.value)}
                      placeholder="ex: 500"
                      min={0}
                      step={0.01}
                    />
                    {artist.buyoutItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArtistBuyoutItem(artist.id, item.id)}
                        aria-label={`Remove ${item.label || "buyout"}`}
                        className="calculator-expense-remove"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <datalist id="common-buyouts">
                  {COMMON_BUYOUTS.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <Button variant="ghost" size="sm" onClick={() => addArtistBuyoutItem(artist.id)} type="button">
                  + Add Buyout
                </Button>
              </div>
              <Select
                label="Buyout Handling"
                value={artist.buyoutMode}
                onChange={(e) => updateArtistField(artist.id, "buyoutMode", e.target.value)}
              >
                <option value="deduct_from_balance">Deduct from artist balance (venue provided these)</option>
                <option value="show_expense">Treat as show expense (reduces net profit)</option>
              </Select>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addArtist} type="button" style={{ marginBottom: "1rem" }}>
            + Add Another Artist
          </Button>

          <h3 className="calculator-section-title">Notes (optional)</h3>
          <div className="ds-input-wrapper">
            <textarea
              className="ds-input ds-input-md calculator-notes-textarea"
              name="notes"
              value={formData.notes}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, notes: e.target.value }));
                if (result) setResultsStale(true);
              }}
              placeholder="General settlement notes, disputes, or special terms&#10;e.g., &quot;Artist provided own sound engineer — $200 credit applied&quot;"
              rows={3}
            />
            <p className="ds-input-hint">Visible on the settlement summary and shared report</p>
          </div>

          <h3 className="calculator-section-title">Merch (optional)</h3>
          <div className="calculator-form-row">
            <Input
              id="merchGross"
              name="merchGross"
              label="Gross Merch Sales ($)"
              type="number"
              value={formData.merchGross}
              onChange={handleInputChange}
              placeholder="ex: 2000"
              min={0}
              step={0.01}
            />
            <Input
              id="merchVenuePercent"
              name="merchVenuePercent"
              label="Venue Merch Cut (%)"
              type="number"
              value={formData.merchVenuePercent}
              onChange={handleInputChange}
              placeholder="ex: 20"
              hint="Standard is 15–25% of gross merch"
              min={0}
              max={100}
              step={0.1}
            />
          </div>

          {errorMessage && (
            <div className="calculator-save-status error" style={{ marginTop: "1rem" }}>{errorMessage}</div>
          )}

          <Button type="button" variant="primary" size="lg" onClick={handleCalculate} style={{ width: "100%", marginTop: "1rem" }}>
            Calculate Settlement
          </Button>
        </Card>

        {result && resultsStale && (
          <div className="calculator-stale-banner">
            Inputs have changed since last calculation. Recalculate to update results.
          </div>
        )}

        {result && (
          <section className="results-section" style={{ marginTop: "2rem" }}>
            <Card className="results-card" variant="elevated" padding="lg">
              <h2>Settlement Summary</h2>
              {(result.totalDueToArtist != null || result.balanceDue != null) && (
                <div className="calculator-result-row result-row highlight balance-due balance-due-callout">
                  <span className="label">
                    {(result.artists || []).length > 1 ? "Total balance due" : "Pay tonight"}
                  </span>
                  <span className="value">
                    {formatCurrency(result.totalDueToArtist ?? result.balanceDue ?? 0)}
                  </span>
                </div>
              )}
              {(() => {
                const names = (result.artists || []).map((a) => a.artistName).filter(Boolean).join(", ");
                return names ? <p className="artist-name-display">Settlement for: {names}</p> : null;
              })()}
              {warnings.length > 0 && (
                <div className="calculator-warnings">
                  {warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}
              {result.notes && (
                <div className="calculator-notes-display">
                  <strong>Notes:</strong> {result.notes}
                </div>
              )}
              {result.ticketTiers && result.ticketTiers.length > 1 ? (
                <>
                  {result.ticketTiers.map((tier, index) => (
                    <div key={index} className="calculator-result-row result-row">
                      <span className="label">{tier.name} ({tier.sold} × {formatCurrency(tier.price)})</span>
                      <span className="value">{formatCurrency(tier.revenue)}</span>
                    </div>
                  ))}
                  <div className="calculator-result-row result-row tier-subtotal">
                    <span className="label">
                      Gross Revenue ({result.totalTicketsSold} sold{result.totalComps ? `, ${result.totalComps} comps` : ''})
                    </span>
                    <span className="value">{formatCurrency(result.grossRevenue)}</span>
                  </div>
                </>
              ) : (
                <div className="calculator-result-row result-row">
                  <span className="label">
                    Gross Revenue{result.totalTicketsSold ? ` (${result.totalTicketsSold} sold${result.totalComps ? `, ${result.totalComps} comps` : ''})` : ''}
                  </span>
                  <span className="value">{formatCurrency(result.grossRevenue)}</span>
                </div>
              )}
              <div className="calculator-result-row result-row">
                <span className="label">
                  Tax ({formData.taxRate || '0'}%{formData.taxMode === 'inclusive' ? ', included in price' : ''})
                </span>
                <span className="value">−{formatCurrency(result.taxAmount)}</span>
              </div>
              {result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === 'off_top' && (
                <div className="calculator-result-row result-row">
                  <span className="label">CC Processing Fees ({formData.ccFeeRate}%)</span>
                  <span className="value">−{formatCurrency(result.ccFees)}</span>
                </div>
              )}
              {result.expenseItems && result.expenseItems.length > 0 ? (
                <>
                  {result.expenseItems.map((item, index) => (
                    <div key={index} className="calculator-result-row result-row">
                      <span className="label">
                        {item.label}
                        {item.note && <span className="calculator-line-note">{item.note}</span>}
                      </span>
                      <span className="value">−{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {(result.artists || []).map((ar) => {
                    const fa = formData.artists[result.artists.indexOf(ar)];
                    if (fa?.buyoutMode !== "show_expense" || !ar.buyoutItems) return null;
                    return ar.buyoutItems.map((item, bi) => (
                      <div key={`buyout-exp-${ar.artistName}-${bi}`} className="calculator-result-row result-row">
                        <span className="label">{item.label} (buyout{(result.artists || []).length > 1 ? ` — ${ar.artistName}` : ''})</span>
                        <span className="value">−{formatCurrency(item.amount)}</span>
                      </div>
                    ));
                  })}
                  {result.expenseItems.length > 1 && (
                    <div className="calculator-result-row result-row expense-subtotal">
                      <span className="label">Total Expenses</span>
                      <span className="value">−{formatCurrency(result.totalExpenses)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="calculator-result-row result-row">
                  <span className="label">Expenses</span>
                  <span className="value">−{formatCurrency(result.totalExpenses)}</span>
                </div>
              )}
              <div className="calculator-result-row result-row highlight">
                <span className="label">Net</span>
                <span className="value">{formatCurrency(result.netProfit)}</span>
              </div>

              {(result.artists || []).map((ar, arIdx) => {
                const fa = formData.artists[arIdx];
                const isMulti = (result.artists || []).length > 1;
                const hasDeductions = ar.deposit > 0 || (ar.withholdingAmount != null && ar.withholdingAmount > 0) || (ar.totalBuyouts != null && ar.totalBuyouts > 0 && fa?.buyoutMode === "deduct_from_balance");
                return (
                  <div key={arIdx} className="calculator-artist-result-block">
                    {isMulti && (
                      <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>{ar.artistName}</h3>
                    )}
                    <p className="calculator-deal-summary">
                      {getDealSummary(ar, fa, result.netProfit, result.grossRevenue, result.taxAmount)}
                    </p>
                    {ar.overage != null && ar.breakeven != null && (
                      <>
                        <div className="calculator-result-row result-row">
                          <span className="label">Guarantee</span>
                          <span className="value">{formatCurrency(ar.artistPayout - ar.overage)}</span>
                        </div>
                        <div className="calculator-result-row result-row">
                          <span className="label">Breakeven Point</span>
                          <span className="value">{formatCurrency(ar.breakeven)}</span>
                        </div>
                        <div className="calculator-result-row result-row">
                          <span className="label">Back-End Overage</span>
                          <span className="value">{formatCurrency(ar.overage)}</span>
                        </div>
                      </>
                    )}
                    <div className="calculator-result-row result-row highlight artist-payout">
                      <span className="label">
                        {isMulti ? `${ar.artistName} Payout` : 'Artist Payout'}
                        {ar.overage != null && ' (Guarantee + Overage)'}
                        {ar.dealType === 'percentage_of_gross' && ` (${fa?.percentage || ''}% of Gross)`}
                        {ar.dealType === 'door_deal' && ` (${fa?.percentage || ''}% of Gross After Tax)`}
                      </span>
                      <span className="value">{formatCurrency(ar.artistPayout)}</span>
                    </div>
                    {ar.withholdingAmount != null && ar.withholdingAmount > 0 && (
                      <div className="calculator-result-row result-row">
                        <span className="label">
                          Withholding Tax ({fa?.withholdingRate || ''}%{ar.withholdingState ? `, ${ar.withholdingState}` : ''})
                        </span>
                        <span className="value">−{formatCurrency(ar.withholdingAmount)}</span>
                      </div>
                    )}
                    {ar.buyoutItems && ar.buyoutItems.length > 0 && fa?.buyoutMode === 'deduct_from_balance' && (
                      ar.buyoutItems.map((item, index) => (
                        <div key={`buyout-deduct-${index}`} className="calculator-result-row result-row">
                          <span className="label">{item.label}</span>
                          <span className="value">−{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                    {hasDeductions && (
                      <>
                        {ar.deposit > 0 && (
                          <div className="calculator-result-row result-row">
                            <span className="label">Deposit Paid</span>
                            <span className="value">−{formatCurrency(ar.deposit)}</span>
                          </div>
                        )}
                        <div className={`calculator-result-row result-row highlight ${ar.balanceDue < 0 ? 'overpayment' : 'balance-due'}`}>
                          <span className="label">
                            {ar.balanceDue < 0 ? 'Overpayment (due back to promoter)' : 'Balance Due at Settlement'}
                          </span>
                          <span className="value">{formatCurrency(Math.abs(ar.balanceDue))}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {(result.artists || []).length > 1 && (
                <div className="calculator-result-row result-row highlight" style={{ marginTop: "1rem" }}>
                  <span className="label">Total Artist Payouts</span>
                  <span className="value">{formatCurrency(result.artistPayout)}</span>
                </div>
              )}

              {result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === 'expense' && (
                <div className="calculator-result-row result-row">
                  <span className="label">CC Processing Fees ({formData.ccFeeRate}%, venue cost)</span>
                  <span className="value">−{formatCurrency(result.ccFees)}</span>
                </div>
              )}
              <div className={`calculator-result-row result-row highlight ${result.venuePayout < 0 ? 'venue-loss' : 'venue-payout'}`}>
                <span className="label">
                  {result.venuePayout < 0 ? 'Venue Loss' : 'Promoter/House Settlement'}
                </span>
                <span className="value">{result.venuePayout < 0 ? '−' : ''}{formatCurrency(Math.abs(result.venuePayout))}</span>
              </div>
              {result.merchGross != null && result.merchGross > 0 && (
                <>
                  <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>Merch Settlement</h3>
                  <div className="calculator-result-row result-row">
                    <span className="label">Gross Merch Sales</span>
                    <span className="value">{formatCurrency(result.merchGross)}</span>
                  </div>
                  <div className="calculator-result-row result-row">
                    <span className="label">Venue Merch Cut ({formData.merchVenuePercent || '0'}%)</span>
                    <span className="value">−{formatCurrency(result.merchVenueCut ?? 0)}</span>
                  </div>
                  <div className="calculator-result-row result-row highlight artist-payout">
                    <span className="label">Net Merch to Artist</span>
                    <span className="value">{formatCurrency(result.merchNetToArtist ?? 0)}</span>
                  </div>
                  {result.totalDueToArtist != null && (
                    <>
                      <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>Total</h3>
                      <div className="calculator-result-row result-row">
                        <span className="label">Show Balance Due</span>
                        <span className="value">{formatCurrency(result.deposit > 0 ? result.balanceDue : result.artistPayout)}</span>
                      </div>
                      <div className="calculator-result-row result-row">
                        <span className="label">Net Merch to Artist</span>
                        <span className="value">{formatCurrency(result.merchNetToArtist ?? 0)}</span>
                      </div>
                      <div className="calculator-result-row result-row highlight artist-payout">
                        <span className="label">Total Due to Artist</span>
                        <span className="value">{formatCurrency(result.totalDueToArtist)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              {result.acknowledgments && result.acknowledgments.length > 0 && (
                <div className="calculator-acknowledgments">
                  <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>Acknowledgments</h3>
                  {result.acknowledgments.map((ack, i) => (
                    <div key={i} className="calculator-ack-entry">
                      Acknowledged by <strong>{ack.name}</strong>{ack.email ? ` (${ack.email})` : ""} on {new Date(ack.timestamp).toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
              {result.calculatedAt && (
                <p className="calculator-calculated-at">
                  Calculated {new Date(result.calculatedAt).toLocaleString()}
                </p>
              )}
              <Button variant="secondary" onClick={handlePrint} className="calculator-print-btn" style={{ width: "100%", marginTop: "1.25rem" }}>
                🖨️ Print / Save as PDF
              </Button>
            </Card>
          </section>
        )}

      </div>

    </AppShell>
  );
}

export default function CalculatorContent(props: CalculatorContentProps) {
  return (
    <Suspense
      fallback={
        <AppShell maxWidth={720} userEmail={props.userEmail} showNavLinks={false} userMenuContent={<AppAccountMenu initialData={props.accountMenuData} />}>
          <div className="calculator-container">
            <div className="calculator-loading"><p>Loading...</p></div>
          </div>
        </AppShell>
      }
    >
      <CalculatorInner {...props} />
    </Suspense>
  );
}
