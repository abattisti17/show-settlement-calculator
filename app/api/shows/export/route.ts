import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * GET /api/shows/export
 * Exports all shows for the authenticated user as CSV.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: shows, error } = await supabase
      .from("shows")
      .select("id, title, show_date, inputs, results, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch shows" },
        { status: 500 }
      );
    }

    const rows: string[] = [];
    const headers = [
      "Show ID",
      "Title",
      "Show Date",
      "Artist(s)",
      "Gross Revenue",
      "Tax Amount",
      "Total Expenses",
      "Net Profit",
      "Artist Payout",
      "Venue Payout",
      "Balance Due",
      "Deposit",
      "Created",
      "Updated",
    ];
    rows.push(headers.map(escapeCsvCell).join(","));

    for (const show of shows || []) {
      const inputs = (show.inputs as Record<string, unknown>) || {};
      const results = (show.results as Record<string, unknown>) || {};

      const artistNames = (() => {
        const artists = results.artists as { artistName: string }[] | undefined;
        if (artists && artists.length > 0) {
          return artists.map((a) => a.artistName).join("; ");
        }
        return (inputs.artistName as string) || "";
      })();

      const grossRevenue = (results.grossRevenue as number) ?? "";
      const taxAmount = (results.taxAmount as number) ?? "";
      const totalExpenses = (results.totalExpenses as number) ?? "";
      const netProfit = (results.netProfit as number) ?? "";
      const artistPayout = (results.artistPayout as number) ?? "";
      const venuePayout = (results.venuePayout as number) ?? "";
      const balanceDue = (results.balanceDue as number) ?? "";
      const deposit = (results.deposit as number) ?? "";

      const showDate = show.show_date
        ? new Date(show.show_date).toISOString().slice(0, 10)
        : "";
      const created = show.created_at
        ? new Date(show.created_at).toISOString()
        : "";
      const updated = show.updated_at
        ? new Date(show.updated_at).toISOString()
        : "";

      rows.push(
        [
          show.id,
          show.title ?? "",
          showDate,
          artistNames,
          grossRevenue,
          taxAmount,
          totalExpenses,
          netProfit,
          artistPayout,
          venuePayout,
          balanceDue,
          deposit,
          created,
          updated,
        ].map(escapeCsvCell).join(",")
      );
    }

    const csv = rows.join("\n");
    const filename = `gigsettle-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Shows export error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
