"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function acknowledgeSettlement(
  token: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!name.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (!token.trim()) {
    return { success: false, error: "Invalid share link." };
  }

  const serviceClient = createServiceClient();

  const { data: shareLink, error: linkError } = await serviceClient
    .from("share_links")
    .select("show_id, is_active")
    .eq("token", token)
    .single();

  if (linkError || !shareLink || !shareLink.is_active) {
    return { success: false, error: "Share link not found or inactive." };
  }

  const { data: show, error: showError } = await serviceClient
    .from("shows")
    .select("results")
    .eq("id", shareLink.show_id)
    .single();

  if (showError || !show) {
    return { success: false, error: "Show not found." };
  }

  const existing: { name: string; email: string; timestamp: string }[] =
    show.results?.acknowledgments || [];

  const updated = [
    ...existing,
    {
      name: name.trim(),
      email: email.trim(),
      timestamp: new Date().toISOString(),
    },
  ];

  const { error: updateError } = await serviceClient
    .from("shows")
    .update({ results: { ...show.results, acknowledgments: updated } })
    .eq("id", shareLink.show_id);

  if (updateError) {
    return { success: false, error: "Failed to save acknowledgment." };
  }

  return { success: true };
}
