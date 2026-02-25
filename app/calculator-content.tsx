"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu, type AppAccountMenuData } from "@/components/ui/AppAccountMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Popover } from "@/components/ui/Popover";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { BreakdownList } from "@/components/ui/BreakdownList";
import SharePopover from "./components/SharePopover";
import { computeSettlement, formatCurrency, parseNumber, round2 } from "@/lib/settlement/calculate";
import "./calculator.css";

type DealType = "guarantee" | "percentage" | "guarantee_vs_percentage" | "guarantee_plus_percentage" | "percentage_of_gross" | "door_deal";

const DEAL_TYPE_HELP: Record<DealType, string> = {
  guarantee: "Flat payout regardless of show performance.",
  percentage: "Artist receives a percentage of net profit after tax and expenses.",
  guarantee_vs_percentage:
    "Artist receives whichever is higher: guarantee or percentage of net.",
  guarantee_plus_percentage:
    "Artist receives guarantee plus backend percentage above breakeven.",
  percentage_of_gross:
    "Artist receives a percentage of gross ticket revenue before deductions.",
  door_deal:
    "Artist receives a percentage of gross after tax, before expenses.",
};

function sanitizeNonNegative(value: string) {
  return value.replace(/-/g, "");
}

function sanitizePercent(value: string) {
  const cleaned = sanitizeNonNegative(value);
  const parsed = parseFloat(cleaned);
  if (!Number.isNaN(parsed) && parsed > 100) return "100";
  return cleaned;
}

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
  netProfit: number
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

interface DestructiveConfirmPopoverProps {
  label: string;
  ariaLabel: string;
  onConfirm: () => void;
  className?: string;
}

function DestructiveConfirmPopover({
  label,
  ariaLabel,
  onConfirm,
  className,
}: DestructiveConfirmPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      trigger={
        <Button
          variant="ghost"
          size="sm"
          aria-label={ariaLabel}
          className={className}
        >
          × Remove
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
      align="right"
      panelWidth={300}
      className="calculator-confirm-popover-panel"
    >
      <p className="calculator-confirm-popover-text">
        Remove {label}? This action cannot be undone.
      </p>
      <div className="calculator-confirm-popover-actions">
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            onConfirm();
            setOpen(false);
          }}
        >
          Yes, remove
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Popover>
  );
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

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
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Error loading show:', error);
      }
    }

    loadShow();
  }, [searchParams, userId, supabase]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name } = e.target;
    const numericFields = new Set([
      "capacity",
      "expectedGross",
      "taxRate",
      "ccFeeRate",
      "merchGross",
    ]);
    const percentFields = new Set(["merchVenuePercent"]);
    const rawValue = e.target.value;
    const value = percentFields.has(name)
      ? sanitizePercent(rawValue)
      : numericFields.has(name)
      ? sanitizeNonNegative(rawValue)
      : rawValue;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function addTicketTier() {
    const id = String(tierIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      ticketTiers: [...prev.ticketTiers, { id, name: "", price: "", sold: "", comps: "" }],
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function removeTicketTier(id: string) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((tier) => tier.id !== id),
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function updateTicketTier(id: string, field: keyof Omit<TicketTier, "id">, value: string) {
    const safeValue =
      field === "price" || field === "sold" || field === "comps"
        ? sanitizeNonNegative(value)
        : value;
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: safeValue } : tier
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function addExpenseItem() {
    const id = String(expenseIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      expenseItems: [...prev.expenseItems, { id, label: "", amount: "" }],
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function removeExpenseItem(id: string) {
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.filter((item) => item.id !== id),
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function updateExpenseItem(id: string, field: "label" | "amount" | "note", value: string) {
    const safeValue = field === "amount" ? sanitizeNonNegative(value) : value;
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.map((item) =>
        item.id === id ? { ...item, [field]: safeValue } : item
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function addArtist() {
    const id = String(artistIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      artists: [...prev.artists, defaultArtist(id)],
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function removeArtist(artistId: string) {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.filter((a) => a.id !== artistId),
    }));
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
  }

  function updateArtistField(artistId: string, field: string, value: string) {
    const percentFields = new Set(["percentage", "withholdingRate"]);
    const numericFields = new Set(["guarantee", "breakeven", "deposit"]);
    const safeValue = percentFields.has(field)
      ? sanitizePercent(value)
      : numericFields.has(field)
      ? sanitizeNonNegative(value)
      : value;
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId ? { ...a, [field]: safeValue } : a
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  }

  function updateArtistBuyoutItem(artistId: string, buyoutId: string, field: "label" | "amount", value: string) {
    const safeValue = field === "amount" ? sanitizeNonNegative(value) : value;
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a) =>
        a.id === artistId
          ? { ...a, buyoutItems: a.buyoutItems.map((b) => b.id === buyoutId ? { ...b, [field]: safeValue } : b) }
          : a
      ),
    }));
    if (errorMessage) setErrorMessage("");
    if (result) setResultsStale(true);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  }

  useEffect(() => {
    function handleKeyboardCalculate(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      handleCalculate();
    }

    window.addEventListener("keydown", handleKeyboardCalculate);
    return () => {
      window.removeEventListener("keydown", handleKeyboardCalculate);
    };
  });

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

  async function handleSaveShow(): Promise<string | null> {
    if (!formData.showName.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please enter a show name before saving.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return null;
    }

    const freshCalc = computeSettlement(formData);
    const isDraftSave = !freshCalc.ok;
    if (!isDraftSave) {
      setResult(freshCalc.result);
      setWarnings(freshCalc.warnings);
      setResultsStale(false);
    }

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
          allowDraft: isDraftSave,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save");
      }

      const savedShowId = data.showId as string;
      if (!currentShowId) setCurrentShowId(savedShowId);
      setSaveStatus('success');
      if (isDraftSave) {
        setSaveMessage("Draft saved. Complete required fields to finalize settlement.");
      } else {
        setSaveMessage(currentShowId ? 'Settlement updated successfully!' : 'Settlement saved successfully!');
      }
      setHasUnsavedChanges(false);
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return savedShowId;
    } catch (error) {
      console.error('Error saving show:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save show. Please try again.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return null;
    }
  }

  const liveInputWarnings = useMemo(() => {
    const items: string[] = [];
    const capacity = parseNumber(formData.capacity);
    const totalSold = formData.ticketTiers.reduce((sum, tier) => sum + parseNumber(tier.sold), 0);
    if (capacity > 0 && totalSold > capacity) {
      items.push(`Tickets sold (${totalSold}) is above venue capacity (${capacity}).`);
    }
    for (const tier of formData.ticketTiers) {
      const sold = parseNumber(tier.sold);
      const comps = parseNumber(tier.comps);
      if (comps > sold) {
        items.push(`${tier.name || "Tier"} has more comps than sold tickets.`);
      }
    }
    return items;
  }, [formData.capacity, formData.ticketTiers]);

  function handleBackToDashboard() {
    if (hasUnsavedChanges) {
      setPendingNavigation(true);
      return;
    }
    router.push("/dashboard");
  }

  function handleConfirmLeave() {
    setPendingNavigation(false);
    router.push("/dashboard");
  }

  async function handleSaveAndShare() {
    const showId = await handleSaveShow();
    if (!showId) return;

    try {
      const createRes = await fetch("/api/share-links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId }),
      });

      if (!createRes.ok) throw new Error("Failed to create share link");
      const createData = await createRes.json();
      const token = createData.token as string;
      const url = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(url);
      setSaveStatus("success");
      setSaveMessage("Share link copied. You can send it now.");
      setTimeout(() => { setSaveMessage(""); setSaveStatus("idle"); }, 4000);
    } catch (error) {
      console.error("Error sharing show:", error);
      setSaveStatus("error");
      setSaveMessage("Saved, but could not create share link. Try again.");
      setTimeout(() => { setSaveMessage(""); setSaveStatus("idle"); }, 4000);
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
          onClick={handleBackToDashboard}
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
                  disabled={saveStatus === 'saving'}
                  variant="primary"
                  size="sm"
                  loading={saveStatus === 'saving'}
                >
                  {result && !resultsStale
                    ? (currentShowId ? "Update Settlement" : "Save Settlement")
                    : "Save Draft"}
                </Button>
              </div>
              {currentShowId && result && (
                <div className="calculator-header-actions-row share-popover-row">
                  <SharePopover
                    showId={currentShowId}
                    showName={formData.showName}
                    resultsStale={resultsStale}
                  />
                </div>
              )}
              {!currentShowId && result && (
                <div className="calculator-header-actions-row">
                  <Button
                    onClick={handleSaveAndShare}
                    variant="secondary"
                    size="sm"
                    disabled={saveStatus === "saving" || resultsStale}
                  >
                    Save & Copy Share Link
                  </Button>
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

        {pendingNavigation && (
          <div className="calculator-remove-confirm">
            <p>You have unsaved changes. Leave this page and discard edits?</p>
            <div className="calculator-remove-confirm-actions">
              <Button variant="danger" size="sm" onClick={handleConfirmLeave}>
                Leave Without Saving
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPendingNavigation(false)}>
                Stay Here
              </Button>
            </div>
          </div>
        )}

        {result && resultsStale && (
          <div className="calculator-stale-banner calculator-stale-banner-prominent">
            Results are out of date. Recalculate before sharing or finalizing payout.
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
                  aria-label={`Tier ${index + 1} name`}
                  value={tier.name}
                  onChange={(e) => updateTicketTier(tier.id, "name", e.target.value)}
                  placeholder="ex: General Admission"
                />
                <Input
                  label={index === 0 ? "Price ($)" : undefined}
                  aria-label={`Tier ${index + 1} price`}
                  type="number"
                  value={tier.price}
                  onChange={(e) => updateTicketTier(tier.id, "price", e.target.value)}
                  placeholder="ex: 25"
                  min={0}
                  step={0.01}
                />
                <Input
                  label={index === 0 ? "Sold" : undefined}
                  aria-label={`Tier ${index + 1} sold`}
                  type="number"
                  value={tier.sold}
                  onChange={(e) => updateTicketTier(tier.id, "sold", e.target.value)}
                  placeholder="ex: 200"
                  min={0}
                  step={1}
                />
                <Input
                  label={index === 0 ? "Comps" : undefined}
                  aria-label={`Tier ${index + 1} comps`}
                  type="number"
                  value={tier.comps}
                  onChange={(e) => updateTicketTier(tier.id, "comps", e.target.value)}
                  placeholder="0"
                  min={0}
                  step={1}
                />
                {formData.ticketTiers.length > 1 && (
                  <DestructiveConfirmPopover
                    label={tier.name || "this tier"}
                    ariaLabel={`Remove ${tier.name || "tier"}`}
                    onConfirm={() => removeTicketTier(tier.id)}
                    className="calculator-tier-remove"
                  />
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
            label="Ticket report gross check ($)"
            type="number"
            value={formData.expectedGross}
            onChange={handleInputChange}
            placeholder="Optional: paste gross from your ticketing report"
            min={0}
            step={0.01}
            hint="Use this to quickly catch payout math mismatches."
          />

          <h3 className="calculator-section-title">Tax & Fees</h3>
          <div className="calculator-form-row">
            <Input id="taxRate" name="taxRate" label="Entertainment / Sales Tax (%)" type="number" value={formData.taxRate} onChange={handleInputChange} placeholder="ex: 10" min={0} max={100} step={0.1} hint="Amusement tax, sales tax, or venue tax rate" />
            <Select id="taxMode" name="taxMode" label="Tax Treatment" value={formData.taxMode} onChange={handleInputChange}>
              <option value="exclusive">Tax added on top of ticket price</option>
              <option value="inclusive">Ticket prices already include tax</option>
            </Select>
          </div>
          <div className="calculator-form-row">
            <Input id="ccFeeRate" name="ccFeeRate" label="CC Processing Fee (%)" type="number" value={formData.ccFeeRate} onChange={handleInputChange} placeholder="ex: 2.9" min={0} max={100} step={0.01} hint="Credit card / payment processing rate" />
            <Select id="ccFeeMode" name="ccFeeMode" label="Card Fee Treatment" value={formData.ccFeeMode} onChange={handleInputChange}>
              <option value="expense">Venue-only cost (does not reduce artist deal)</option>
              <option value="off_top">Deduct before artist split (shared impact)</option>
            </Select>
          </div>

          <h3 className="calculator-section-title">Show Expenses</h3>
          <div className="calculator-expense-list">
            {formData.expenseItems.map((item, index) => (
              <div key={item.id} className="calculator-expense-row">
                <Input
                  label={index === 0 ? "Expense" : undefined}
                  aria-label={`Expense ${index + 1} label`}
                  value={item.label}
                  onChange={(e) => updateExpenseItem(item.id, "label", e.target.value)}
                  placeholder="ex: Sound"
                  list="common-expenses"
                />
                <Input
                  label={index === 0 ? "Amount ($)" : undefined}
                  aria-label={`Expense ${index + 1} amount`}
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateExpenseItem(item.id, "amount", e.target.value)}
                  placeholder="ex: 500"
                  min={0}
                  step={0.01}
                />
                {formData.expenseItems.length > 1 && (
                  <DestructiveConfirmPopover
                    label={item.label || "this expense line"}
                    ariaLabel={`Remove ${item.label || "expense"}`}
                    onConfirm={() => removeExpenseItem(item.id)}
                    className="calculator-expense-remove"
                  />
                )}
                {(item.label.trim() || parseNumber(item.amount) > 0) && (
                  <div className="calculator-expense-note">
                    <Input
                      size="sm"
                      className="calculator-note-input"
                      aria-label={`Expense ${index + 1} note`}
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
                  <DestructiveConfirmPopover
                    label={artist.artistName || `Artist ${artistIndex + 1}`}
                    ariaLabel={`Remove ${artist.artistName || `Artist ${artistIndex + 1}`}`}
                    onConfirm={() => removeArtist(artist.id)}
                    className="calculator-artist-remove"
                  />
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
              <p className="ds-input-hint calculator-field-help">
                {DEAL_TYPE_HELP[artist.dealType]}
              </p>

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
                      aria-label={`${artist.artistName || `Artist ${artistIndex + 1}`} buyout ${index + 1} label`}
                      value={item.label}
                      onChange={(e) => updateArtistBuyoutItem(artist.id, item.id, "label", e.target.value)}
                      placeholder="ex: Catering Buyout"
                      list="common-buyouts"
                    />
                    <Input
                      label={index === 0 ? "Amount ($)" : undefined}
                      aria-label={`${artist.artistName || `Artist ${artistIndex + 1}`} buyout ${index + 1} amount`}
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateArtistBuyoutItem(artist.id, item.id, "amount", e.target.value)}
                      placeholder="ex: 500"
                      min={0}
                      step={0.01}
                    />
                    {artist.buyoutItems.length > 1 && (
                      <DestructiveConfirmPopover
                        label={item.label || "this buyout line"}
                        ariaLabel={`Remove ${item.label || "buyout"}`}
                        onConfirm={() => removeArtistBuyoutItem(artist.id, item.id)}
                        className="calculator-expense-remove"
                      />
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
                label="Buyout Treatment"
                value={artist.buyoutMode}
                onChange={(e) => updateArtistField(artist.id, "buyoutMode", e.target.value)}
              >
                <option value="deduct_from_balance">Deduct from artist payout (venue covered these costs)</option>
                <option value="show_expense">Treat as show expense (reduces net before payout)</option>
              </Select>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addArtist} type="button" style={{ marginBottom: "1rem" }}>
            + Add Another Artist
          </Button>

          <h3 className="calculator-section-title">Notes (optional)</h3>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, notes: e.target.value }));
              if (result) setResultsStale(true);
              setHasUnsavedChanges(true);
            }}
            placeholder="General settlement notes, disputes, or special terms&#10;e.g., &quot;Artist provided own sound engineer — $200 credit applied&quot;"
            rows={3}
            hint="Visible on the settlement summary and shared report"
            className="calculator-notes-textarea"
          />

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

          {liveInputWarnings.length > 0 && (
            <div className="calculator-warnings" aria-live="polite">
              {liveInputWarnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" onClick={handleCalculate} className="calculator-calculate-btn">
            Calculate Settlement (Ctrl/Cmd + Enter)
          </Button>
        </Card>

        {result && (
          <section className="results-section" style={{ marginTop: "2rem" }} aria-live="polite">
            <Card className="results-card" variant="elevated" padding="lg">
              <h2>Settlement Summary</h2>
              {(result.totalDueToArtist != null || result.balanceDue != null) && (
                <BreakdownList className="calculator-due-tonight">
                  <BreakdownList.Row
                    label="Amount due tonight"
                    value={formatCurrency(result.totalDueToArtist ?? result.balanceDue ?? 0)}
                    variant="highlight"
                  />
                </BreakdownList>
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
              <BreakdownList>
                {result.ticketTiers && result.ticketTiers.length > 1 ? (
                  <>
                    {result.ticketTiers.map((tier, index) => (
                      <BreakdownList.Row
                        key={index}
                        label={`${tier.name} (${tier.sold} × ${formatCurrency(tier.price)})`}
                        value={formatCurrency(tier.revenue)}
                      />
                    ))}
                    <BreakdownList.Row
                      label={`Gross Revenue (${result.totalTicketsSold} sold${result.totalComps ? `, ${result.totalComps} comps` : ''})`}
                      value={formatCurrency(result.grossRevenue)}
                    />
                  </>
                ) : (
                  <BreakdownList.Row
                    label={`Gross Revenue${result.totalTicketsSold ? ` (${result.totalTicketsSold} sold${result.totalComps ? `, ${result.totalComps} comps` : ''})` : ''}`}
                    value={formatCurrency(result.grossRevenue)}
                  />
                )}
                <BreakdownList.Row
                  label={`Tax (${formData.taxRate || '0'}%${formData.taxMode === 'inclusive' ? ', included in price' : ''})`}
                  value={`−${formatCurrency(result.taxAmount)}`}
                  variant="negative"
                />
                {result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === 'off_top' && (
                  <BreakdownList.Row
                    label={`CC Processing Fees (${formData.ccFeeRate}%)`}
                    value={`−${formatCurrency(result.ccFees)}`}
                    variant="negative"
                  />
                )}
                {result.expenseItems && result.expenseItems.length > 0 ? (
                  <>
                    {result.expenseItems.map((item, index) => (
                      <BreakdownList.Row
                        key={index}
                        label={item.note ? `${item.label} — ${item.note}` : item.label}
                        value={`−${formatCurrency(item.amount)}`}
                        variant="negative"
                      />
                    ))}
                    {(result.artists || []).map((ar) => {
                      const fa = formData.artists[result.artists.indexOf(ar)];
                      if (fa?.buyoutMode !== "show_expense" || !ar.buyoutItems) return null;
                      return ar.buyoutItems.map((item, bi) => (
                        <BreakdownList.Row
                          key={`buyout-exp-${ar.artistName}-${bi}`}
                          label={`${item.label} (buyout${(result.artists || []).length > 1 ? ` — ${ar.artistName}` : ''})`}
                          value={`−${formatCurrency(item.amount)}`}
                          variant="negative"
                        />
                      ));
                    })}
                    {result.expenseItems.length > 1 && (
                      <BreakdownList.Row
                        label="Total Expenses"
                        value={`−${formatCurrency(result.totalExpenses)}`}
                        variant="negative"
                      />
                    )}
                  </>
                ) : (
                  <BreakdownList.Row
                    label="Expenses"
                    value={`−${formatCurrency(result.totalExpenses)}`}
                    variant="negative"
                  />
                )}
                <BreakdownList.Row
                  label="Net"
                  value={formatCurrency(result.netProfit)}
                  variant="highlight"
                />
              </BreakdownList>

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
                      {getDealSummary(ar, fa, result.netProfit)}
                    </p>
                    <BreakdownList>
                      {ar.overage != null && ar.breakeven != null && (
                        <>
                          <BreakdownList.Row
                            label="Guarantee"
                            value={formatCurrency(ar.artistPayout - ar.overage)}
                          />
                          <BreakdownList.Row
                            label="Breakeven Point"
                            value={formatCurrency(ar.breakeven)}
                          />
                          <BreakdownList.Row
                            label="Back-End Overage"
                            value={formatCurrency(ar.overage)}
                          />
                        </>
                      )}
                      <BreakdownList.Row
                        label={
                          `${isMulti ? `${ar.artistName} Payout` : "Artist Payout"}` +
                          `${ar.overage != null ? " (Guarantee + Overage)" : ""}` +
                          `${ar.dealType === "percentage_of_gross" ? ` (${fa?.percentage || ""}% of Gross)` : ""}` +
                          `${ar.dealType === "door_deal" ? ` (${fa?.percentage || ""}% of Gross After Tax)` : ""}`
                        }
                        value={formatCurrency(ar.artistPayout)}
                        variant="success"
                      />
                      {ar.withholdingAmount != null && ar.withholdingAmount > 0 && (
                        <BreakdownList.Row
                          label={`Withholding Tax (${fa?.withholdingRate || ""}%${ar.withholdingState ? `, ${ar.withholdingState}` : ""})`}
                          value={`−${formatCurrency(ar.withholdingAmount)}`}
                          variant="negative"
                        />
                      )}
                      {ar.buyoutItems && ar.buyoutItems.length > 0 && fa?.buyoutMode === "deduct_from_balance" && (
                        ar.buyoutItems.map((item, index) => (
                          <BreakdownList.Row
                            key={`buyout-deduct-${index}`}
                            label={item.label}
                            value={`−${formatCurrency(item.amount)}`}
                            variant="negative"
                          />
                        ))
                      )}
                      {hasDeductions && ar.deposit > 0 && (
                        <BreakdownList.Row
                          label="Deposit Paid"
                          value={`−${formatCurrency(ar.deposit)}`}
                          variant="negative"
                        />
                      )}
                      {hasDeductions && (
                        <BreakdownList.Row
                          label={ar.balanceDue < 0 ? "Overpayment (due back to promoter)" : "Balance Due at Settlement"}
                          value={formatCurrency(Math.abs(ar.balanceDue))}
                          variant={ar.balanceDue < 0 ? "warning" : "highlight"}
                        />
                      )}
                    </BreakdownList>
                  </div>
                );
              })}

              {(result.artists || []).length > 1 && (
                <BreakdownList className="calculator-summary-breakdown">
                  <BreakdownList.Row
                    label="Total Artist Payouts"
                    value={formatCurrency(result.artistPayout)}
                    variant="success"
                  />
                </BreakdownList>
              )}

              <BreakdownList className="calculator-summary-breakdown">
                {result.ccFees != null && result.ccFees > 0 && formData.ccFeeMode === 'expense' && (
                  <BreakdownList.Row
                    label={`CC Processing Fees (${formData.ccFeeRate}%, venue cost)`}
                    value={`−${formatCurrency(result.ccFees)}`}
                    variant="negative"
                  />
                )}
                <BreakdownList.Row
                  label={result.venuePayout < 0 ? 'Venue Loss' : 'Promoter/House Settlement'}
                  value={`${result.venuePayout < 0 ? '−' : ''}${formatCurrency(Math.abs(result.venuePayout))}`}
                  variant="warning"
                />
              </BreakdownList>
              {result.merchGross != null && result.merchGross > 0 && (
                <>
                  <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>Merch Settlement</h3>
                  <BreakdownList>
                    <BreakdownList.Row
                      label="Gross Merch Sales"
                      value={formatCurrency(result.merchGross)}
                    />
                    <BreakdownList.Row
                      label={`Venue Merch Cut (${formData.merchVenuePercent || '0'}%)`}
                      value={`−${formatCurrency(result.merchVenueCut ?? 0)}`}
                      variant="negative"
                    />
                    <BreakdownList.Row
                      label="Net Merch to Artist"
                      value={formatCurrency(result.merchNetToArtist ?? 0)}
                      variant="success"
                    />
                  </BreakdownList>
                  {result.totalDueToArtist != null && (
                    <>
                      <h3 className="calculator-section-title" style={{ marginTop: "1.5rem" }}>Total</h3>
                      <BreakdownList>
                        <BreakdownList.Row
                          label="Show Balance Due"
                          value={formatCurrency(result.deposit > 0 ? result.balanceDue : result.artistPayout)}
                        />
                        <BreakdownList.Row
                          label="Net Merch to Artist"
                          value={formatCurrency(result.merchNetToArtist ?? 0)}
                        />
                        <BreakdownList.Row
                          label="Total Due to Artist"
                          value={formatCurrency(result.totalDueToArtist)}
                          variant="success"
                        />
                      </BreakdownList>
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
