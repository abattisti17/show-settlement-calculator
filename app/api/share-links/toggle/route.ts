import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/share-links/toggle
 * Toggles the is_active status of a share link
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
    const { showId, isActive } = await request.json();

    if (!showId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "showId and isActive (boolean) are required" },
        { status: 400 }
      );
    }

    // Update share link (RLS enforces ownership through show_id)
    // The share_links_manage_own policy checks that the show belongs to the user
    const { data: updatedLink, error: updateError } = await supabase
      .from("share_links")
      .update({ is_active: isActive })
      .eq("show_id", showId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating share link:", updateError);
      return NextResponse.json(
        { error: "Failed to update share link or share link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        is_active: updatedLink.is_active,
        token: updatedLink.token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in share-links/toggle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
