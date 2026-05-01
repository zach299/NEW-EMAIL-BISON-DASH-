-- ============================================================
-- Seed: Client "Deck" with 3 campaigns, 5 senders, 30 days
-- ============================================================

-- Insert client
insert into clients (id, name, emailbison_workspace_id)
values (
  'a1000000-0000-0000-0000-000000000001',
  'Deck',
  'ws_deck_001'
) on conflict (id) do nothing;

-- Insert campaigns
insert into campaigns (id, client_id, emailbison_campaign_id, name) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'eb_camp_001', 'Q2 Outbound - Founders'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'eb_camp_002', 'Q2 Outbound - VPs of Sales'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'eb_camp_003', 'Reactivation - Old Leads')
on conflict (id) do nothing;

-- Insert leads
insert into leads (id, client_id, email, first_name, last_name, title, company, status) values
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'alex.morgan@techcorp.com', 'Alex', 'Morgan', 'CEO', 'TechCorp', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'sam.chen@scalestartup.io', 'Sam', 'Chen', 'VP of Sales', 'ScaleStartup', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'jordan.lee@growthco.com', 'Jordan', 'Lee', 'Founder', 'GrowthCo', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'riley.park@enterprise.com', 'Riley', 'Park', 'Head of Revenue', 'Enterprise Inc', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'taylor.nguyen@saasco.com', 'Taylor', 'Nguyen', 'CRO', 'SaaSCo', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'morgan.kim@ventures.io', 'Morgan', 'Kim', 'CEO', 'Ventures IO', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'casey.smith@b2bsaas.com', 'Casey', 'Smith', 'VP Sales', 'B2B SaaS Co', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'drew.jones@hypergrowth.com', 'Drew', 'Jones', 'Founder & CEO', 'HyperGrowth', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'quinn.davis@pipeline.io', 'Quinn', 'Davis', 'Director of Sales', 'Pipeline IO', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'avery.wilson@outbound.co', 'Avery', 'Wilson', 'Sales Manager', 'Outbound Co', 'positive_reply'),
  ('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'blake.brown@marketplace.com', 'Blake', 'Brown', 'CEO', 'Marketplace', 'reply'),
  ('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001', 'jamie.white@revops.io', 'Jamie', 'White', 'RevOps Lead', 'RevOps IO', 'reply')
on conflict (id) do nothing;

-- ============================================================
-- SENT events — 30 days, ~25-40/day, 5 senders, 3 campaigns
-- ============================================================
do $$
declare
  senders text[] := array[
    'outreach1@deck-mail.com',
    'outreach2@deck-mail.com',
    'hello@deck-growth.com',
    'team@deck-growth.com',
    'connect@deck-send.com'
  ];
  campaigns uuid[] := array[
    'b1000000-0000-0000-0000-000000000001'::uuid,
    'b1000000-0000-0000-0000-000000000002'::uuid,
    'b1000000-0000-0000-0000-000000000003'::uuid
  ];
  subjects text[] := array[
    'Quick question about your sales process',
    'How [Company] is closing more deals in 2024',
    '2 min — worth a look?',
    'Following up from last week',
    'Thought this might be relevant for [Company]',
    'The #1 thing holding your pipeline back'
  ];
  d int;
  i int;
  sender text;
  campaign uuid;
  subject text;
  day_count int;
  sent_ts timestamptz;
begin
  for d in 0..29 loop
    day_count := 25 + (random() * 15)::int;
    for i in 1..day_count loop
      sender := senders[1 + (random() * 4)::int];
      campaign := campaigns[1 + (random() * 2)::int];
      subject := subjects[1 + (random() * 5)::int];
      sent_ts := (now() - interval '29 days') + (d * interval '1 day') + (random() * interval '8 hours');

      insert into email_events (
        client_id, campaign_id, sender_email, event_type,
        sent_at, subject, step_order, step_variant, raw_payload
      ) values (
        'a1000000-0000-0000-0000-000000000001',
        campaign,
        sender,
        'sent',
        sent_ts,
        subject,
        1 + (random() * 3)::int,
        case when random() < 0.5 then 'A' else 'B' end,
        '{}'::jsonb
      );
    end loop;
  end loop;
end $$;

-- ============================================================
-- REPLY events — ~5% of sent
-- ============================================================
do $$
declare
  sent_event record;
  replied_ts timestamptz;
begin
  for sent_event in
    select id, client_id, campaign_id, sender_email, subject, step_order, step_variant, sent_at
    from email_events
    where event_type = 'sent'
    and client_id = 'a1000000-0000-0000-0000-000000000001'
    and random() < 0.05
  loop
    replied_ts := sent_event.sent_at + (interval '1 hour' * (2 + (random() * 48)::int));
    insert into email_events (
      client_id, campaign_id, sender_email, event_type,
      sent_at, replied_at, subject, step_order, step_variant, raw_payload
    ) values (
      sent_event.client_id,
      sent_event.campaign_id,
      sent_event.sender_email,
      'reply',
      sent_event.sent_at,
      replied_ts,
      sent_event.subject,
      sent_event.step_order,
      sent_event.step_variant,
      '{}'::jsonb
    );
  end loop;
end $$;

-- ============================================================
-- POSITIVE REPLY events — ~40% of replies, linked to leads
-- ============================================================
do $$
declare
  reply_event record;
  lead_ids uuid[] := array[
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'c1000000-0000-0000-0000-000000000002'::uuid,
    'c1000000-0000-0000-0000-000000000003'::uuid,
    'c1000000-0000-0000-0000-000000000004'::uuid,
    'c1000000-0000-0000-0000-000000000005'::uuid,
    'c1000000-0000-0000-0000-000000000006'::uuid,
    'c1000000-0000-0000-0000-000000000007'::uuid,
    'c1000000-0000-0000-0000-000000000008'::uuid,
    'c1000000-0000-0000-0000-000000000009'::uuid,
    'c1000000-0000-0000-0000-000000000010'::uuid
  ];
  lead_idx int := 1;
begin
  for reply_event in
    select id, client_id, campaign_id, sender_email, subject, step_order, step_variant, sent_at, replied_at
    from email_events
    where event_type = 'reply'
    and client_id = 'a1000000-0000-0000-0000-000000000001'
    and random() < 0.4
  loop
    insert into email_events (
      client_id, campaign_id, lead_id, sender_email, event_type,
      sent_at, replied_at, subject, step_order, step_variant,
      interested, raw_payload
    ) values (
      reply_event.client_id,
      reply_event.campaign_id,
      lead_ids[lead_idx],
      reply_event.sender_email,
      'positive_reply',
      reply_event.sent_at,
      reply_event.replied_at,
      reply_event.subject,
      reply_event.step_order,
      reply_event.step_variant,
      true,
      '{}'::jsonb
    );
    lead_idx := (lead_idx % 10) + 1;
  end loop;
end $$;

-- ============================================================
-- BOUNCE events — connect@ has higher rate (~4%), others ~1%
-- ============================================================
do $$
declare
  sent_event record;
  bounced_ts timestamptz;
  bounce_rate float;
begin
  for sent_event in
    select id, client_id, campaign_id, sender_email, subject, step_order, step_variant, sent_at
    from email_events
    where event_type = 'sent'
    and client_id = 'a1000000-0000-0000-0000-000000000001'
  loop
    bounce_rate := case
      when sent_event.sender_email = 'connect@deck-send.com' then 0.04
      else 0.01
    end;

    if random() < bounce_rate then
      bounced_ts := sent_event.sent_at + (interval '1 minute' * (5 + (random() * 60)::int));
      insert into email_events (
        client_id, campaign_id, sender_email, event_type,
        sent_at, bounced_at, subject, step_order, step_variant, raw_payload
      ) values (
        sent_event.client_id,
        sent_event.campaign_id,
        sent_event.sender_email,
        'bounce',
        sent_event.sent_at,
        bounced_ts,
        sent_event.subject,
        sent_event.step_order,
        sent_event.step_variant,
        '{}'::jsonb
      );
    end if;
  end loop;
end $$;
