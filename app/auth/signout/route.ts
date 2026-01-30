import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Route handler for signing out users.
 * Clears the session and redirects to the login page.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}
