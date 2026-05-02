export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  fetchWorkspaces,
  fetchCampaigns,
  fetchSentEvents,
  fetchReplyEvents,
  fetchBounceEvents,
  fetchLeads,
  type EBCredentials,
} from "@/lib/emailbison/api";
import { transformEvent, transformLead } from "@/lib/emailbison/transform";

export async function GET(req: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const header = req.headers.get("x-sync-secret");
    if (header !== syncSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerClient();

  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, emailbison_workspace_id, emailbison_api_key, emailbison_base_url");

  if (clientErr || !clients) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }

  const results: Record<string, unknown>[] = [];

  for (const client of clients) {
    const apiKey = client.emailbison_api_key ?? process.env.EMAILBISON_API_KEY;
    const baseUrl = client.emailbison_base_url ?? process.env.EMAILBISON_BASE_URL ?? "https://api.emailbison.com";

    if (!apiKey) {
      results.push({ client: client.name, skipped: true, reason: "no api key" });
      continue;
    }

    const creds: EBCredentials = { apiKey, baseUrl };

    // Auto-discover workspace ID if not set
    let workspaceId = client.emailbison_workspace_id;
    if (!workspaceId) {
      const workspaces = await fetchWorkspaces(creds);
      if (workspaces.length === 0) {
        results.push({ client: client.name, skipped: true, reason: "could not discover workspace ID" });
        continue;
      }
      workspaceId = String(workspaces[0].id);
      await supabase
        .from("clients")
        .update({ emailbison_workspace_id: workspaceId })
        .eq("id", client.id);
      console.log(`[Sync] Auto-discovered workspace ID ${workspaceId} for client ${client.name}`);
    }

    try {
      const ebCampaigns = await fetchCampaigns(workspaceId, creds);
      let totalEvents = 0;
      let totalLeads = 0;

      for (const ebCampaign of ebCampaigns) {
        const { data: existingCampaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("emailbison_campaign_id", ebCampaign.id)
          .eq("client_id", client.id)
          .maybeSingle();

        let campaignDbId: string;
        if (existingCampaign) {
          campaignDbId = existingCampaign.id;
        } else {
          const { data: newCampaign, error: insertErr } = await supabase
            .from("campaigns")
            .insert({
              client_id: client.id,
              emailbison_campaign_id: ebCampaign.id,
              name: ebCampaign.name,
            })
            .select("id")
            .single();
          if (insertErr || !newCampaign) continue;
          campaignDbId = newCampaign.id;
        }

        const [sent, replies, bounces, leads] = await Promise.all([
          fetchSentEvents(workspaceId, ebCampaign.id, creds),
          fetchReplyEvents(workspaceId, ebCampaign.id, creds),
          fetchBounceEvents(workspaceId, ebCampaign.id, creds),
          fetchLeads(workspaceId, ebCampaign.id, creds),
        ]);

        const allEvents = [...sent, ...replies, ...bounces];
        const eventRows = allEvents.map((e) =>
          transformEvent(e, client.id, campaignDbId)
        );
        const leadRows = leads.map((l) => transformLead(l, client.id));

        if (eventRows.length > 0) {
          const { error } = await supabase
            .from("email_events")
            .upsert(eventRows, { onConflict: "id", ignoreDuplicates: true });
          if (error) console.error(`[Sync] Event upsert error for ${ebCampaign.id}:`, error);
          else totalEvents += eventRows.length;
        }

        if (leadRows.length > 0) {
          const { error } = await supabase
            .from("leads")
            .upsert(leadRows, { onConflict: "id", ignoreDuplicates: true });
          if (error) console.error(`[Sync] Lead upsert error for ${ebCampaign.id}:`, error);
          else totalLeads += leadRows.length;
        }
      }

      results.push({
        client: client.name,
        workspace_id: workspaceId,
        campaigns: ebCampaigns.length,
        events_synced: totalEvents,
        leads_synced: totalLeads,
      });
    } catch (err) {
      results.push({
        client: client.name,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ synced_at: new Date().toISOString(), results });
}
