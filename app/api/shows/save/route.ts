import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSettlement, type CalculationInput } from "@/lib/settlement/calculate";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { showId, title, show_date, inputs, acknowledgments } = body;

    if (!title || !inputs) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, inputs" },
        { status: 400 }
      );
    }

    const calculationInput: CalculationInput = {
      showName: title,
      showDate: show_date || "",
      ticketTiers: inputs.ticketTiers || [],
      capacity: inputs.capacity || "",
      taxRate: inputs.taxRate || "",
      taxMode: inputs.taxMode || "exclusive",
      ccFeeRate: inputs.ccFeeRate || "",
      ccFeeMode: inputs.ccFeeMode || "expense",
      expenseItems: inputs.expenseItems || [],
      artists: inputs.artists || [],
      merchGross: inputs.merchGross || "",
      merchVenuePercent: inputs.merchVenuePercent || "",
      notes: inputs.notes || "",
    };

    const output = computeSettlement(calculationInput);
    if (!output.ok) {
      return NextResponse.json({ success: false, error: output.error }, { status: 400 });
    }

    const results = {
      ...output.result,
      ...(acknowledgments?.length > 0 ? { acknowledgments } : {}),
    };

    const showData = {
      user_id: user.id,
      title: title.trim(),
      show_date: show_date?.trim() || null,
      inputs,
      results,
    };

    if (showId) {
      const { data, error } = await supabase
        .from("shows")
        .update(showData)
        .eq("id", showId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating show:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, showId: data.id });
    } else {
      const { data, error } = await supabase.from("shows").insert([showData]).select().single();

      if (error) {
        console.error("Error inserting show:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, showId: data.id });
    }
  } catch (err) {
    console.error("Save show error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
