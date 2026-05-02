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
  // Try list endpoint first (may return just the one scoped workspace)
  const listPaths = ["/api/v1/workspaces", "/api/workspaces"];
  for (const path of listPaths) {
    try {
      const data = await ebFetch<{ workspaces?: unknown[]; data?: unknown[] }>(path, creds);
      const list = (data.workspaces ?? data.data ?? []) as { id: string; name: string; slug?: string }[];
      if (list.length > 0) return list;
    } catch {
      // try next
    }
  }

  // For workspace-scoped keys, try singular /workspace or /me endpoint
  const singlePaths = ["/api/v1/workspace", "/api/v1/me", "/api/v1/user"];
  for (const path of singlePaths) {
    try {
      const data = await ebFetch<{ workspace?: unknown; data?: unknown; id?: string; name?: string }>(path, creds);
      const ws = (data.workspace ?? data.data ?? data) as { id?: string; name?: string };
      if (ws?.id) return [{ id: String(ws.id), name: ws.name ?? "workspace" }];
    } catch {
      // try next
    }
  }

  return [];
}

// For workspace-scoped keys the workspace ID may be omitted from the URL
export async function fetchCampaignsNoWorkspace(creds: EBCredentials): Promise<EmailBisonCampaign[]> {
  const data = await ebFetch<{ campaigns?: EmailBisonCampaign[]; data?: EmailBisonCampaign[] }>(
    "/api/v1/campaigns",
    creds
  );
  return data.campaigns ?? data.data ?? [];
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
