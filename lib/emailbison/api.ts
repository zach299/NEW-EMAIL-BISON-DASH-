import { EMAILBISON_BASE_URL } from "@/lib/constants";
import type { EmailBisonCampaign, EmailBisonEvent, EmailBisonLead } from "@/types";

export interface EBCredentials {
  apiKey: string;
  baseUrl: string;
}

function getDefaultCredentials(): EBCredentials {
  const apiKey = process.env.EMAILBISON_API_KEY;
  if (!apiKey) throw new Error("EMAILBISON_API_KEY is not set");
  return { apiKey, baseUrl: EMAILBISON_BASE_URL };
}

async function ebFetch<T>(path: string, creds?: EBCredentials): Promise<T> {
  const { apiKey, baseUrl } = creds ?? getDefaultCredentials();

  const res = await fetch(`${baseUrl}${path}`, {
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

export async function fetchWorkspaces(creds: EBCredentials): Promise<{ id: string; name: string; slug?: string }[]> {
  // Try known endpoint patterns
  const paths = ["/api/v1/workspaces", "/api/workspaces", "/v1/workspaces"];
  for (const path of paths) {
    try {
      const data = await ebFetch<{ workspaces?: unknown[]; data?: unknown[] }>(path, creds);
      const list = (data.workspaces ?? data.data ?? []) as { id: string; name: string; slug?: string }[];
      if (list.length > 0) return list;
    } catch {
      // try next path
    }
  }
  return [];
}

export async function fetchCampaigns(workspaceId: string, creds?: EBCredentials): Promise<EmailBisonCampaign[]> {
  const data = await ebFetch<{ campaigns?: EmailBisonCampaign[]; data?: EmailBisonCampaign[] }>(
    `/api/v1/workspaces/${workspaceId}/campaigns`,
    creds
  );
  return data.campaigns ?? data.data ?? [];
}

export async function fetchSentEvents(
  workspaceId: string,
  campaignId: string,
  creds?: EBCredentials,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/api/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/sent${query}`,
    creds
  );
  return data.events ?? data.data ?? [];
}

export async function fetchReplyEvents(
  workspaceId: string,
  campaignId: string,
  creds?: EBCredentials,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/api/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/replies${query}`,
    creds
  );
  return data.events ?? data.data ?? [];
}

export async function fetchBounceEvents(
  workspaceId: string,
  campaignId: string,
  creds?: EBCredentials,
  since?: string
): Promise<EmailBisonEvent[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await ebFetch<{ events?: EmailBisonEvent[]; data?: EmailBisonEvent[] }>(
    `/api/v1/workspaces/${workspaceId}/campaigns/${campaignId}/events/bounces${query}`,
    creds
  );
  return data.events ?? data.data ?? [];
}

export async function fetchLeads(
  workspaceId: string,
  campaignId: string,
  creds?: EBCredentials
): Promise<EmailBisonLead[]> {
  const data = await ebFetch<{ leads?: EmailBisonLead[]; data?: EmailBisonLead[] }>(
    `/api/v1/workspaces/${workspaceId}/campaigns/${campaignId}/leads`,
    creds
  );
  return data.leads ?? data.data ?? [];
}
