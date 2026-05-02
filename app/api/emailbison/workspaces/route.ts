export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchWorkspaces, fetchCampaignsNoWorkspace } from "@/lib/emailbison/api";

export async function GET(req: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const header = req.headers.get("x-sync-secret");
    if (header !== syncSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, emailbison_api_key, emailbison_base_url, emailbison_workspace_id");

  const results = [];
  for (const client of clients ?? []) {
    const apiKey = client.emailbison_api_key ?? process.env.EMAILBISON_API_KEY;
    const baseUrl = client.emailbison_base_url ?? process.env.EMAILBISON_BASE_URL ?? "https://api.emailbison.com";
    if (!apiKey) {
      results.push({ client: client.name, error: "no api key" });
      continue;
    }
    try {
      const workspaces = await fetchWorkspaces({ apiKey, baseUrl });
      // Also probe workspace-less campaigns endpoint for scoped keys
      let scopedCampaignCount: number | null = null;
      try {
        const campaigns = await fetchCampaignsNoWorkspace({ apiKey, baseUrl });
        scopedCampaignCount = campaigns.length;
      } catch { /* not supported */ }
      results.push({
        client: client.name,
        current_workspace_id: client.emailbison_workspace_id,
        available_workspaces: workspaces,
        scoped_campaigns_at_root: scopedCampaignCount,
      });
    } catch (err) {
      results.push({
        client: client.name,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
