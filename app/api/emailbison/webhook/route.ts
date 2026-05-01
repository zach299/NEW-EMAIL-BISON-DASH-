export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { transformEvent } from "@/lib/emailbison/transform";
import type { EmailBisonEvent } from "@/types";

export async function POST(req: NextRequest) {
  const secret = process.env.EMAILBISON_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-webhook-secret");
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as {
    workspace_id?: string;
    client_id?: string;
    campaign_id?: string;
    event?: EmailBisonEvent;
    events?: EmailBisonEvent[];
  };

  const clientId = payload.client_id;
  const campaignDbId = payload.campaign_id;

  if (!clientId || !campaignDbId) {
    return NextResponse.json(
      { error: "Missing client_id or campaign_id in payload" },
      { status: 400 }
    );
  }

  const rawEvents: EmailBisonEvent[] = payload.events ??
    (payload.event ? [payload.event] : []);

  if (rawEvents.length === 0) {
    return NextResponse.json({ received: 0 });
  }

  const supabase = createServerClient();
  const rows = rawEvents.map((e) => transformEvent(e, clientId, campaignDbId));

  const { error } = await supabase.from("email_events").insert(rows);
  if (error) {
    console.error("[Webhook] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: rows.length });
}
