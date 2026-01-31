import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/share-links/get?showId=xxx
 * Retrieves the share link for a show if it exists
 * Requires authentication (RLS enforces ownership)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get("showId");

    if (!showId) {
      return NextResponse.json(
        { error: "showId query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch share link (RLS enforces ownership through show_id)
    const { data: shareLink, error } = await supabase
      .from("share_links")
      .select("token, is_active, created_at")
      .eq("show_id", showId)
      .single();

    if (error) {
      // No share link exists for this show
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        exists: true,
        token: shareLink.token,
        is_active: shareLink.is_active,
        created_at: shareLink.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in share-links/get:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
