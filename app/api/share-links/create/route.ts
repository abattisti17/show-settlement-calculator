import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * POST /api/share-links/create
 * Creates a share link for a show
 * Requires authentication (RLS enforces ownership)
 */
export async function POST(request: Request) {
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

    // Parse request body
    const { showId } = await request.json();

    if (!showId) {
      return NextResponse.json(
        { error: "showId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the show (RLS will enforce this, but we check explicitly)
    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("id")
      .eq("id", showId)
      .eq("user_id", user.id)
      .single();

    if (showError || !show) {
      return NextResponse.json(
        { error: "Show not found or access denied" },
        { status: 404 }
      );
    }

    // Check if share link already exists
    const { data: existingLink } = await supabase
      .from("share_links")
      .select("token, is_active")
      .eq("show_id", showId)
      .single();

    if (existingLink) {
      return NextResponse.json(
        {
          token: existingLink.token,
          is_active: existingLink.is_active,
          already_exists: true,
        },
        { status: 200 }
      );
    }

    // Generate cryptographically secure random token
    const token = randomBytes(32).toString("hex");

    // Insert share link (RLS enforces ownership through show_id foreign key)
    const { data: shareLink, error: insertError } = await supabase
      .from("share_links")
      .insert({
        show_id: showId,
        token: token,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating share link:", insertError);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        token: shareLink.token,
        is_active: shareLink.is_active,
        already_exists: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in share-links/create:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
