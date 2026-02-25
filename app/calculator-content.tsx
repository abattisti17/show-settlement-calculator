"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu, type AppAccountMenuData } from "@/components/ui/AppAccountMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import ShareLinkManager from "./components/ShareLinkManager";
import "./calculator.css";

type DealType = "guarantee" | "percentage" | "guarantee_vs_percentage" | "guarantee_plus_percentage";

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
}

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

interface FormData {
  showName: string;
  artistName: string;
  ticketTiers: TicketTier[];
  capacity: string;
  taxRate: string;
  expenseItems: ExpenseItem[];
  dealType: DealType;
  guarantee: string;
  percentage: string;
  breakeven: string;
  deposit: string;
}

interface CalculationResult {
  grossRevenue: number;
  ticketTiers?: { name: string; price: number; sold: number; comps: number; revenue: number }[];
  totalTicketsSold?: number;
  totalComps?: number;
  taxAmount: number;
  totalExpenses: number;
  expenseItems?: { label: string; amount: number }[];
  netProfit: number;
  artistPayout: number;
  overage?: number;
  breakeven?: number;
  deposit: number;
  balanceDue: number;
  venuePayout: number;
}

export interface CalculatorContentProps {
  userId: string;
  userEmail: string;
  accountMenuData: AppAccountMenuData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function CalculatorInner({ userId, userEmail, accountMenuData }: CalculatorContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const tierIdCounter = useRef(2);
  const expenseIdCounter = useRef(2);

  const [formData, setFormData] = useState<FormData>({
    showName: "",
    artistName: "",
    ticketTiers: [{ id: "1", name: "General Admission", price: "", sold: "", comps: "" }],
    capacity: "",
    taxRate: "",
    expenseItems: [{ id: "1", label: "", amount: "" }],
    dealType: "guarantee",
    guarantee: "",
    percentage: "",
    breakeven: "",
    deposit: "",
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
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
              (item: { label: string; amount: string }, i: number) => ({
                id: String(i + 1),
                label: item.label || "",
                amount: item.amount || "",
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

          setFormData({
            showName: data.title || '',
            artistName: data.inputs.artistName || '',
            ticketTiers: loadedTiers,
            capacity: data.inputs.capacity || '',
            taxRate: data.inputs.taxRate || '',
            expenseItems: loadedExpenseItems,
            dealType: data.inputs.dealType || 'guarantee',
            guarantee: data.inputs.guarantee || '',
            percentage: data.inputs.percentage || '',
            breakeven: data.inputs.breakeven || '',
            deposit: data.inputs.deposit || '',
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
  }

  function addTicketTier() {
    const id = String(tierIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      ticketTiers: [...prev.ticketTiers, { id, name: "", price: "", sold: "", comps: "" }],
    }));
  }

  function removeTicketTier(id: string) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((tier) => tier.id !== id),
    }));
  }

  function updateTicketTier(id: string, field: keyof Omit<TicketTier, "id">, value: string) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      ),
    }));
    if (errorMessage) setErrorMessage("");
  }

  function addExpenseItem() {
    const id = String(expenseIdCounter.current++);
    setFormData((prev) => ({
      ...prev,
      expenseItems: [...prev.expenseItems, { id, label: "", amount: "" }],
    }));
  }

  function removeExpenseItem(id: string) {
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.filter((item) => item.id !== id),
    }));
  }

  function updateExpenseItem(id: string, field: "label" | "amount", value: string) {
    setFormData((prev) => ({
      ...prev,
      expenseItems: prev.expenseItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    if (errorMessage) setErrorMessage("");
  }

  function handleCalculate() {
    const taxRate = parseNumber(formData.taxRate);
    const guarantee = parseNumber(formData.guarantee);
    const percentage = parseNumber(formData.percentage);

    const parsedTiers = formData.ticketTiers
      .filter((t) => parseNumber(t.price) > 0 || parseNumber(t.sold) > 0)
      .map((t) => {
        const price = parseNumber(t.price);
        const sold = parseNumber(t.sold);
        const comps = parseNumber(t.comps);
        return {
          name: t.name.trim() || "General Admission",
          price,
          sold,
          comps,
          revenue: price * sold,
        };
      });

    const totalTicketsSold = parsedTiers.reduce((sum, t) => sum + t.sold, 0);
    const totalComps = parsedTiers.reduce((sum, t) => sum + t.comps, 0);
    const grossRevenue = parsedTiers.reduce((sum, t) => sum + t.revenue, 0);

    const parsedExpenseItems = formData.expenseItems
      .filter((item) => item.label.trim() || parseNumber(item.amount) > 0)
      .map((item) => ({
        label: item.label.trim() || "Unlabeled Expense",
        amount: parseNumber(item.amount),
      }));
    const totalExpenses = parsedExpenseItems.reduce((sum, item) => sum + item.amount, 0);

    if (parsedTiers.length === 0 || grossRevenue <= 0) {
      setErrorMessage("Please enter at least one ticket tier with a valid price and quantity sold.");
      setResult(null);
      return;
    }

    if (formData.dealType === "guarantee" && guarantee <= 0) {
      setErrorMessage("Please enter a valid guarantee amount.");
      setResult(null);
      return;
    }

    if (formData.dealType === "percentage" && percentage <= 0) {
      setErrorMessage("Please enter a valid percentage.");
      setResult(null);
      return;
    }

    if (
      formData.dealType === "guarantee_vs_percentage" &&
      (guarantee <= 0 || percentage <= 0)
    ) {
      setErrorMessage("Please enter both guarantee amount and percentage.");
      setResult(null);
      return;
    }

    if (
      formData.dealType === "guarantee_plus_percentage" &&
      (guarantee <= 0 || percentage <= 0)
    ) {
      setErrorMessage("Please enter both guarantee amount and back-end percentage.");
      setResult(null);
      return;
    }

    const taxAmount = grossRevenue * (taxRate / 100);
    const netProfit = grossRevenue - taxAmount - totalExpenses;

    let artistPayout: number;
    let overage: number | undefined;
    let breakevenPoint: number | undefined;

    switch (formData.dealType) {
      case "guarantee":
        artistPayout = guarantee;
        break;
      case "percentage":
        artistPayout = Math.max(0, netProfit * (percentage / 100));
        break;
      case "guarantee_vs_percentage": {
        const percentageShare = Math.max(0, netProfit * (percentage / 100));
        artistPayout = Math.max(guarantee, percentageShare);
        break;
      }
      case "guarantee_plus_percentage": {
        const userBreakeven = parseNumber(formData.breakeven);
        breakevenPoint = userBreakeven > 0 ? userBreakeven : guarantee + totalExpenses;
        overage = Math.max(0, (netProfit - breakevenPoint) * (percentage / 100));
        artistPayout = guarantee + overage;
        break;
      }
      default:
        artistPayout = 0;
    }

    const venuePayout = netProfit - artistPayout;
    const deposit = parseNumber(formData.deposit);
    const balanceDue = artistPayout - deposit;

    setResult({
      grossRevenue,
      ticketTiers: parsedTiers,
      totalTicketsSold,
      totalComps,
      taxAmount,
      totalExpenses,
      expenseItems: parsedExpenseItems,
      netProfit,
      artistPayout,
      overage,
      breakeven: breakevenPoint,
      deposit,
      balanceDue,
      venuePayout,
    });

    setErrorMessage("");
  }

  function handlePrint() {
    window.print();
  }

  async function handleSaveShow() {
    if (!formData.showName.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please enter a show name before saving.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return;
    }

    if (!result) {
      setSaveStatus('error');
      setSaveMessage('Please calculate the settlement before saving.');
      setTimeout(() => { setSaveMessage(''); setSaveStatus('idle'); }, 4000);
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      const showData = {
        user_id: userId,
        title: formData.showName.trim(),
        inputs: {
          artistName: formData.artistName,
          ticketTiers: formData.ticketTiers.map(({ name, price, sold, comps }) => ({ name, price, sold, comps })),
          capacity: formData.capacity,
          ticketPrice: formData.ticketTiers[0]?.price || '',
          ticketsSold: String(formData.ticketTiers.reduce((sum, t) => sum + parseNumber(t.sold), 0)),
          taxRate: formData.taxRate,
          expenseItems: formData.expenseItems.map(({ label, amount }) => ({ label, amount })),
          totalExpenses: String(
            formData.expenseItems.reduce((sum, item) => sum + parseNumber(item.amount), 0)
          ),
          dealType: formData.dealType,
          guarantee: formData.guarantee,
          percentage: formData.percentage,
          breakeven: formData.breakeven,
          deposit: formData.deposit,
        },
        results: result,
      };

      let savedShowId: string;

      if (currentShowId) {
        const { data, error } = await supabase
          .from('shows')
          .update(showData)
          .eq('id', currentShowId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        savedShowId = data.id;
        setSaveStatus('success');
        setSaveMessage('Show updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('shows')
          .insert([showData])
          .select()
          .single();

        if (error) throw error;
        savedShowId = data.id;
        setCurrentShowId(savedShowId);
        setSaveStatus('success');
        setSaveMessage('Show saved successfully!');
      }

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
            <Button
              onClick={handleSaveShow}
              disabled={!result || saveStatus === 'saving'}
              variant="primary"
              size="sm"
              loading={saveStatus === 'saving'}
            >
              {currentShowId ? 'Update Show' : 'Save Show'}
            </Button>
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
          <Input id="artistName" name="artistName" label="Artist / Band Name" value={formData.artistName} onChange={handleInputChange} placeholder="ex: The Rolling Stones" />

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

          <h3 className="calculator-section-title">Tax & Expenses</h3>
          <Input id="taxRate" name="taxRate" label="Tax Rate (%)" type="number" value={formData.taxRate} onChange={handleInputChange} placeholder="ex: 10" min={0} max={100} step={0.1} />

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

          <h3 className="calculator-section-title">Deal Structure</h3>
          <Select id="dealType" name="dealType" label="Deal Type" value={formData.dealType} onChange={handleInputChange}>
            <option value="guarantee">Guarantee</option>
            <option value="percentage">Percentage of Net</option>
            <option value="guarantee_vs_percentage">Guarantee vs Percentage (whichever is higher)</option>
            <option value="guarantee_plus_percentage">Guarantee + Back-End Percentage</option>
          </Select>

          <div className="calculator-form-row">
            {(formData.dealType === "guarantee" || formData.dealType === "guarantee_vs_percentage" || formData.dealType === "guarantee_plus_percentage") && (
              <Input id="guarantee" name="guarantee" label="Guarantee Amount ($)" type="number" value={formData.guarantee} onChange={handleInputChange} placeholder="ex: 1000" min={0} step={0.01} />
            )}
            {(formData.dealType === "percentage" || formData.dealType === "guarantee_vs_percentage" || formData.dealType === "guarantee_plus_percentage") && (
              <Input id="percentage" name="percentage" label={formData.dealType === "guarantee_plus_percentage" ? "Back-End Percentage (%)" : "Percentage (%)"} type="number" value={formData.percentage} onChange={handleInputChange} placeholder="ex: 85" min={0} max={100} step={0.1} />
            )}
          </div>
          {formData.dealType === "guarantee_plus_percentage" && (
            <Input
              id="breakeven"
              name="breakeven"
              label="Breakeven Point ($)"
              type="number"
              value={formData.breakeven}
              onChange={handleInputChange}
              placeholder="Leave blank to auto-calculate"
              hint="Defaults to guarantee + total expenses if left blank"
              min={0}
              step={0.01}
            />
          )}

          <Input
            id="deposit"
            name="deposit"
            label="Deposit / Advance Already Paid ($)"
            type="number"
            value={formData.deposit}
            onChange={handleInputChange}
            placeholder="ex: 500"
            hint="Amount already wired to the artist before the show"
            min={0}
            step={0.01}
          />

          {errorMessage && (
            <div className="calculator-save-status error" style={{ marginTop: "1rem" }}>{errorMessage}</div>
          )}

          <Button type="button" variant="primary" size="lg" onClick={handleCalculate} style={{ width: "100%", marginTop: "1rem" }}>
            Calculate Settlement
          </Button>
        </Card>

        {result && (
          <section className="results-section" style={{ marginTop: "2rem" }}>
            <Card className="results-card" variant="elevated" padding="lg">
              <h2>Settlement Summary</h2>
              {formData.artistName && (
                <p className="artist-name-display">Settlement for: {formData.artistName}</p>
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
                <span className="label">Tax</span>
                <span className="value">−{formatCurrency(result.taxAmount)}</span>
              </div>
              {result.expenseItems && result.expenseItems.length > 0 ? (
                <>
                  {result.expenseItems.map((item, index) => (
                    <div key={index} className="calculator-result-row result-row">
                      <span className="label">{item.label}</span>
                      <span className="value">−{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
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
              {result.overage != null && result.breakeven != null && (
                <>
                  <div className="calculator-result-row result-row">
                    <span className="label">Guarantee</span>
                    <span className="value">{formatCurrency(result.artistPayout - result.overage)}</span>
                  </div>
                  <div className="calculator-result-row result-row">
                    <span className="label">Breakeven Point</span>
                    <span className="value">{formatCurrency(result.breakeven)}</span>
                  </div>
                  <div className="calculator-result-row result-row">
                    <span className="label">Back-End Overage</span>
                    <span className="value">{formatCurrency(result.overage)}</span>
                  </div>
                </>
              )}
              <div className="calculator-result-row result-row highlight artist-payout">
                <span className="label">Artist Payout{result.overage != null ? ' (Guarantee + Overage)' : ''}</span>
                <span className="value">{formatCurrency(result.artistPayout)}</span>
              </div>
              {result.deposit > 0 && (
                <>
                  <div className="calculator-result-row result-row">
                    <span className="label">Deposit Paid</span>
                    <span className="value">−{formatCurrency(result.deposit)}</span>
                  </div>
                  <div className={`calculator-result-row result-row highlight ${result.balanceDue < 0 ? 'overpayment' : 'balance-due'}`}>
                    <span className="label">
                      {result.balanceDue < 0 ? 'Overpayment (due back to promoter)' : 'Balance Due at Settlement'}
                    </span>
                    <span className="value">{formatCurrency(Math.abs(result.balanceDue))}</span>
                  </div>
                </>
              )}
              <div className="calculator-result-row result-row highlight venue-payout">
                <span className="label">Promoter/House Settlement</span>
                <span className="value">{formatCurrency(result.venuePayout)}</span>
              </div>
              <Button variant="secondary" onClick={handlePrint} className="calculator-print-btn" style={{ width: "100%", marginTop: "1.25rem" }}>
                🖨️ Print / Save as PDF
              </Button>
            </Card>
          </section>
        )}

        {currentShowId && result && (
          <section style={{ marginTop: "2rem" }}>
            <ShareLinkManager showId={currentShowId} showName={formData.showName} />
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
