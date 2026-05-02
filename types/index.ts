export type EventType = "sent" | "reply" | "positive_reply" | "bounce";

export interface Client {
  id: string;
  name: string;
  logo_url: string | null;
  emailbison_workspace_id: string | null;
  emailbison_api_key?: string | null;
  emailbison_base_url?: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  emailbison_campaign_id: string;
  name: string;
  created_at: string;
}

export interface EmailEvent {
  id: string;
  client_id: string;
  campaign_id: string | null;
  lead_id: string | null;
  sender_email: string;
  event_type: EventType;
  sent_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  interested: boolean;
  subject: string | null;
  step_order: number | null;
  step_variant: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface Lead {
  id: string;
  client_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  status: string | null;
  custom_variables: Record<string, unknown> | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface DashboardFilters {
  clientId: string;
  campaignIds: string[];
  senderEmails: string[];
  dateFrom: string;
  dateTo: string;
}

export interface KPIMetrics {
  totalSent: number;
  totalReplies: number;
  totalPositiveReplies: number;
  totalBounces: number;
  replyRate: number;
  positiveReplyRate: number;
  bounceRate: number;
  avgSentPerDay: number;
  bestCampaignName: string | null;
  bestCampaignPositiveReplyRate: number | null;
}

export interface DailyMetric {
  date: string;
  count: number;
}

export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  sent: number;
  replies: number;
  positive_replies: number;
  bounces: number;
  reply_rate: number;
  positive_reply_rate: number;
  bounce_rate: number;
}

export interface VariantMetrics {
  subject: string;
  step_order: number | null;
  step_variant: string | null;
  sent: number;
  replies: number;
  positive_replies: number;
  reply_rate: number;
  positive_reply_rate: number;
  bounce_rate: number;
}

export interface SenderMetrics {
  sender_email: string;
  sent: number;
  replies: number;
  positive_replies: number;
  bounces: number;
  bounce_rate: number;
  status: "healthy" | "warning" | "critical";
}

export interface PositiveReplyItem {
  id: string;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_title: string | null;
  lead_company: string | null;
  lead_email: string;
  campaign_name: string | null;
  subject: string | null;
  replied_at: string | null;
  sender_email: string;
}

export interface FunnelStep {
  name: string;
  value: number;
  conversionRate: number;
}

export interface InsightCard {
  title: string;
  value: string;
  subtitle: string;
  type: "positive" | "warning" | "neutral";
}

export interface EmailBisonCampaign {
  id: string;
  name: string;
  workspace_id: string;
  [key: string]: unknown;
}

export interface EmailBisonEvent {
  id: string;
  type: string;
  campaign_id: string;
  lead_id?: string;
  sender_email?: string;
  from_email?: string;
  subject?: string;
  sent_at?: string;
  created_at?: string;
  timestamp?: string;
  replied_at?: string;
  bounced_at?: string;
  interested?: boolean;
  step?: number;
  step_order?: number;
  variant?: string;
  step_variant?: string;
  lead?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    company?: string;
    status?: string;
  };
  [key: string]: unknown;
}

export interface EmailBisonLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  status?: string;
  custom_variables?: Record<string, unknown>;
  [key: string]: unknown;
}
