import { EMAILBISON_BASE_URL } from "@/lib/constants";
import type { EmailBisonCampaign, EmailBisonEvent, EmailBisonLead } from "@/types";

async function ebFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.EMAILBISON_API_KEY;
  if (!apiKey) throw new Error("EMAILBISON_API_KEY is not set");

  const res = await fetch(`${EMAILBISON_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`EmailBison API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchCampaigns(workspaceId: string): Promise<EmailBisonCampaign[]> {
  const data = await ebFetch<{ campaigns?: EmailBisonCampaign[]; data?: EmailBisonCampaign[] }>(
    `/v1/workspaces/${workspaceId}/campaigns`
  );
  return data.campaigns ?? data.data ?? [];
}

export async function fetchSentEvents(
  workspaceId: string,
  campaignId: string,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/sent${query}`
  );
  return data.events ?? data.data ?? [];
}

export async function fetchReplyEvents(
  workspaceId: string,
  campaignId: string,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/replies${query}`
  );
  return data.events ?? data.data ?? [];
}

export async function fetchBounceEvents(
  workspaceId: string,
  campaignId: string,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/bounces${query}`
  );
  return data.events ?? data.data ?? [];
}

export async function fetchLeads(
  workspaceId: string,
  campaignId: string
): Promise<EmailBisonLead[]> {
  const data = await ebFetch<{ leads?: EmailBisonLead[]; data?: EmailBisonLead[] }>(
    `/v1/workspaces/${workspaceId}/campaigns/${campaignId}/leads`
  );
  return data.leads ?? data.data ?? [];
}
