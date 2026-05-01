-- clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  emailbison_workspace_id text,
  created_at timestamptz default now()
);

-- campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  emailbison_campaign_id text not null,
  name text not null,
  created_at timestamptz default now()
);

-- leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  title text,
  company text,
  status text,
  custom_variables jsonb,
  raw_payload jsonb,
  created_at timestamptz default now()
);

-- email_events
create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  lead_id uuid,
  sender_email text not null,
  event_type text not null check (event_type in ('sent', 'reply', 'positive_reply', 'bounce')),
  sent_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  interested boolean default false,
  subject text,
  step_order int,
  step_variant text,
  raw_payload jsonb,
  created_at timestamptz default now()
);

-- indexes
create index if not exists idx_email_events_client_id on email_events(client_id);
create index if not exists idx_email_events_campaign_id on email_events(campaign_id);
create index if not exists idx_email_events_event_type on email_events(event_type);
create index if not exists idx_email_events_sent_at on email_events(sent_at);
create index if not exists idx_email_events_interested on email_events(interested) where interested = true;
create index if not exists idx_campaigns_client_id on campaigns(client_id);
create index if not exists idx_leads_client_id on leads(client_id);
