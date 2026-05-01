import type { EmailBisonEvent, EmailBisonLead, EmailEvent, EventType, Lead } from "@/types";

function missingFieldLog(field: string, context: string) {
  console.warn(`[EmailBison] Missing field "${field}" in ${context} — rendering as N/A`);
}

function resolveEventType(raw: EmailBisonEvent): EventType {
  const t = (raw.type ?? "").toLowerCase();
  if (t.includes("positive") || t.includes("interested")) return "positive_reply";
  if (t.includes("reply")) return "reply";
  if (t.includes("bounce")) return "bounce";
  return "sent";
}

export function transformEvent(
  raw: EmailBisonEvent,
  clientId: string,
  campaignDbId: string
): Omit<EmailEvent, "id" | "created_at"> {
  const senderEmail = raw.sender_email ?? raw.from_email ?? null;
  if (!senderEmail) missingFieldLog("sender_email / from_email", `event ${raw.id}`);

  const subject = raw.subject ?? null;
  if (!subject) missingFieldLog("subject", `event ${raw.id}`);

  const eventType = resolveEventType(raw);
  const interested = raw.interested ?? eventType === "positive_reply";

  const sentAt = raw.sent_at ?? raw.timestamp ?? raw.created_at ?? null;
  const repliedAt =
    eventType === "reply" || eventType === "positive_reply"
      ? raw.replied_at ?? raw.timestamp ?? raw.created_at ?? null
      : null;
  const bouncedAt =
    eventType === "bounce"
      ? raw.bounced_at ?? raw.timestamp ?? raw.created_at ?? null
      : null;

  return {
    client_id: clientId,
    campaign_id: campaignDbId,
    lead_id: raw.lead_id ?? raw.lead?.id ?? null,
    sender_email: senderEmail ?? "unknown@unknown.com",
    event_type: eventType,
    sent_at: sentAt,
    replied_at: repliedAt,
    bounced_at: bouncedAt,
    interested,
    subject,
    step_order: raw.step_order ?? raw.step ?? null,
    step_variant: raw.step_variant ?? raw.variant ?? null,
    raw_payload: raw as Record<string, unknown>,
  };
}

export function transformLead(
  raw: EmailBisonLead,
  clientId: string
): Omit<Lead, "id" | "created_at"> {
  if (!raw.email) missingFieldLog("email", `lead ${raw.id}`);

  return {
    client_id: clientId,
    email: raw.email ?? "unknown@unknown.com",
    first_name: raw.first_name ?? null,
    last_name: raw.last_name ?? null,
    title: raw.title ?? null,
    company: raw.company ?? null,
    status: raw.status ?? null,
    custom_variables: raw.custom_variables ?? null,
    raw_payload: raw as Record<string, unknown>,
  };
}
