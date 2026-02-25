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

type DealType = "guarantee" | "percentage" | "guarantee_vs_percentage";

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
  ticketPrice: string;
  ticketsSold: string;
  taxRate: string;
  expenseItems: ExpenseItem[];
  dealType: DealType;
  guarantee: string;
  percentage: string;
}

interface CalculationResult {
  grossRevenue: number;
  taxAmount: number;
  totalExpenses: number;
  expenseItems?: { label: string; amount: number }[];
  netProfit: number;
  artistPayout: number;
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
  const expenseIdCounter = useRef(2);

  const [formData, setFormData] = useState<FormData>({
    showName: "",
    artistName: "",
    ticketPrice: "",
    ticketsSold: "",
    taxRate: "",
    expenseItems: [{ id: "1", label: "", amount: "" }],
    dealType: "guarantee",
    guarantee: "",
    percentage: "",
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
            ticketPrice: data.inputs.ticketPrice || '',
            ticketsSold: data.inputs.ticketsSold || '',
            taxRate: data.inputs.taxRate || '',
            expenseItems: loadedExpenseItems,
            dealType: data.inputs.dealType || 'guarantee',
            guarantee: data.inputs.guarantee || '',
            percentage: data.inputs.percentage || '',
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
    const ticketPrice = parseNumber(formData.ticketPrice);
    const ticketsSold = parseNumber(formData.ticketsSold);
    const taxRate = parseNumber(formData.taxRate);
    const guarantee = parseNumber(formData.guarantee);
    const percentage = parseNumber(formData.percentage);

    const parsedExpenseItems = formData.expenseItems
      .filter((item) => item.label.trim() || parseNumber(item.amount) > 0)
      .map((item) => ({
        label: item.label.trim() || "Unlabeled Expense",
        amount: parseNumber(item.amount),
      }));
    const totalExpenses = parsedExpenseItems.reduce((sum, item) => sum + item.amount, 0);

    if (ticketPrice <= 0 || ticketsSold <= 0) {
      setErrorMessage("Please enter valid ticket price and tickets sold.");
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

    const grossRevenue = ticketPrice * ticketsSold;
    const taxAmount = grossRevenue * (taxRate / 100);
    const netProfit = grossRevenue - taxAmount - totalExpenses;

    let artistPayout: number;
    switch (formData.dealType) {
      case "guarantee":
        artistPayout = guarantee;
        break;
      case "percentage":
        artistPayout = Math.max(0, netProfit * (percentage / 100));
        break;
      case "guarantee_vs_percentage":
        const percentageShare = Math.max(0, netProfit * (percentage / 100));
        artistPayout = Math.max(guarantee, percentageShare);
        break;
      default:
        artistPayout = 0;
    }

    const venuePayout = netProfit - artistPayout;

    setResult({
      grossRevenue,
      taxAmount,
      totalExpenses,
      expenseItems: parsedExpenseItems,
      netProfit,
      artistPayout,
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
          ticketPrice: formData.ticketPrice,
          ticketsSold: formData.ticketsSold,
          taxRate: formData.taxRate,
          expenseItems: formData.expenseItems.map(({ label, amount }) => ({ label, amount })),
          totalExpenses: String(
            formData.expenseItems.reduce((sum, item) => sum + parseNumber(item.amount), 0)
          ),
          dealType: formData.dealType,
          guarantee: formData.guarantee,
          percentage: formData.percentage,
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
          <div className="calculator-form-row">
            <Input id="ticketPrice" name="ticketPrice" label="Ticket Price ($)" type="number" value={formData.ticketPrice} onChange={handleInputChange} placeholder="ex: 25" min={0} step={0.01} />
            <Input id="ticketsSold" name="ticketsSold" label="Tickets Sold" type="number" value={formData.ticketsSold} onChange={handleInputChange} placeholder="ex: 200" min={0} step={1} />
          </div>

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
          </Select>

          <div className="calculator-form-row">
            {(formData.dealType === "guarantee" || formData.dealType === "guarantee_vs_percentage") && (
              <Input id="guarantee" name="guarantee" label="Guarantee Amount ($)" type="number" value={formData.guarantee} onChange={handleInputChange} placeholder="ex: 1000" min={0} step={0.01} />
            )}
            {(formData.dealType === "percentage" || formData.dealType === "guarantee_vs_percentage") && (
              <Input id="percentage" name="percentage" label="Percentage (%)" type="number" value={formData.percentage} onChange={handleInputChange} placeholder="ex: 80" min={0} max={100} step={0.1} />
            )}
          </div>

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
              <div className="calculator-result-row result-row">
                <span className="label">Gross Revenue</span>
                <span className="value">{formatCurrency(result.grossRevenue)}</span>
              </div>
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
              <div className="calculator-result-row result-row highlight artist-payout">
                <span className="label">Artist Payout</span>
                <span className="value">{formatCurrency(result.artistPayout)}</span>
              </div>
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
