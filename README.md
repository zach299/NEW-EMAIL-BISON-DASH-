# EmailBison Cold Email Performance Dashboard

A premium, client-facing cold email performance dashboard powered by EmailBison data. Built with Next.js 14 App Router, Tailwind CSS, Supabase, and Recharts.

## What This App Does

- Tracks **sent**, **reply**, **positive reply**, and **bounce** events per client, campaign, sender inbox, subject line, and date range
- Displays KPI cards, daily trend charts, a reply funnel, campaign leaderboard, sender inbox health, subject line/variant performance, and a live positive reply feed
- Auto-generates a plain-English performance summary and insight cards
- Supports multiple clients — add a new client row in Supabase and they appear in the nav

**No open metrics. No open rate. No open tracking. Ever.**

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd emailbison-dashboard
npm install
```

### 2. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `EMAILBISON_BASE_URL` | EmailBison API base URL |
| `EMAILBISON_API_KEY` | Your EmailBison API key |
| `EMAILBISON_WEBHOOK_SECRET` | Secret to verify incoming webhooks |
| `SYNC_SECRET` | Secret header value for manual sync trigger |

### 3. Run Supabase migration

In the Supabase SQL editor (or via Supabase CLI):

```bash
# With Supabase CLI
supabase db push --file supabase/migrations/001_initial.sql

# Or paste contents of supabase/migrations/001_initial.sql into the SQL editor
```

### 4. Seed with sample data (optional)

Paste the contents of `supabase/seed.sql` into the Supabase SQL editor.

This creates the "Deck" client with 3 campaigns, 5 sender inboxes, and 30 days of realistic activity including 10+ positive replies.

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard`.

---

## Connecting EmailBison

### Environment variables

Set `EMAILBISON_BASE_URL` and `EMAILBISON_API_KEY` in `.env.local`. These are used by the API layer in `lib/emailbison/api.ts`.

### Webhook (real-time events)

Point your EmailBison workspace webhook to:

```
POST https://your-domain.com/api/emailbison/webhook
```

Include the header `x-webhook-secret: <your EMAILBISON_WEBHOOK_SECRET>` in the webhook config.

The payload must include:
```json
{
  "client_id": "<supabase client UUID>",
  "campaign_id": "<supabase campaign UUID>",
  "events": [...]
}
```

### Manual sync (backfill)

Trigger a full sync across all clients by calling:

```bash
curl -H "x-sync-secret: <your SYNC_SECRET>" \
  https://your-domain.com/api/emailbison/sync
```

This fetches all campaigns and events from the EmailBison API and upserts them into Supabase.

---

## Adding a New Client

1. **Create the client row** in Supabase:
```sql
insert into clients (name, emailbison_workspace_id)
values ('Acme Corp', 'ws_acme_001');
```

2. **Add campaigns** (or run the manual sync — it will auto-create campaigns from EmailBison):
```sql
insert into campaigns (client_id, emailbison_campaign_id, name)
values ('<client_uuid>', 'eb_camp_xxx', 'Campaign Name');
```

3. **Run the manual sync** to pull historical data:
```bash
curl -H "x-sync-secret: <SYNC_SECRET>" https://your-domain.com/api/emailbison/sync
```

4. The new client will immediately appear in the dashboard client selector.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Add all environment variables from `.env.local.example` in the Vercel project settings
4. Deploy — Vercel will auto-build and serve the Next.js app

The webhook URL will be `https://<your-vercel-domain>/api/emailbison/webhook`.

---

## Architecture

```
app/
  dashboard/page.tsx          — Main dashboard (client component, fetches from Supabase directly)
  api/emailbison/
    webhook/route.ts          — Incoming EmailBison webhook handler
    sync/route.ts             — Manual full-sync trigger
lib/
  emailbison/api.ts           — EmailBison API client
  emailbison/transform.ts     — Raw API → DB row mapping
  metrics.ts                  — All metric calculations (pure functions)
  supabase/client.ts          — Browser Supabase client
  supabase/server.ts          — Server-side Supabase client (service role)
components/
  charts/                     — Recharts bar/funnel charts
  tables/                     — Data tables
  KPICard, TopNav, FilterBar, PerformanceInsights
supabase/
  migrations/001_initial.sql  — DB schema
  seed.sql                    — Sample data for Deck
```