"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import {
  computeKPIs,
  computeDailySent,
  computeDailyReplies,
  computeDailyPositiveReplies,
  computeDailyBounces,
  computeCampaignMetrics,
  computeVariantMetrics,
  computeSenderMetrics,
  computeFunnel,
  computeInsights,
  generateSummary,
} from "@/lib/metrics";
import { getBounceStatus, BOUNCE_STATUS_COLORS } from "@/lib/constants";
import { formatPct, formatNumber } from "@/lib/utils";
import { TopNav } from "@/components/TopNav";
import { FilterBar } from "@/components/FilterBar";
import { KPICard } from "@/components/KPICard";
import { PerformanceInsights } from "@/components/PerformanceInsights";
import { DailySentChart } from "@/components/charts/DailySentChart";
import { DailyRepliesChart } from "@/components/charts/DailyRepliesChart";
import { DailyPositiveRepliesChart } from "@/components/charts/DailyPositiveRepliesChart";
import { DailyBouncesChart } from "@/components/charts/DailyBouncesChart";
import { ReplyFunnelChart } from "@/components/charts/ReplyFunnelChart";
import { CampaignLeaderboard } from "@/components/tables/CampaignLeaderboard";
import { VariantPerformanceTable } from "@/components/tables/VariantPerformanceTable";
import { SenderHealthTable } from "@/components/tables/SenderHealthTable";
import { PositiveReplyFeed } from "@/components/tables/PositiveReplyFeed";
import { ErrorMessage } from "@/components/ui/error-message";
import type {
  Client,
  Campaign,
  EmailEvent,
  DashboardFilters,
  KPIMetrics,
  CampaignMetrics,
  VariantMetrics,
  SenderMetrics,
  FunnelStep,
  InsightCard,
  DailyMetric,
  PositiveReplyItem,
} from "@/types";

const today = format(new Date(), "yyyy-MM-dd");
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [senderEmails, setSenderEmails] = useState<string[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    clientId: "",
    campaignIds: [],
    senderEmails: [],
    dateFrom: thirtyDaysAgo,
    dateTo: today,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [dailySent, setDailySent] = useState<DailyMetric[]>([]);
  const [dailyReplies, setDailyReplies] = useState<DailyMetric[]>([]);
  const [dailyPositive, setDailyPositive] = useState<DailyMetric[]>([]);
  const [dailyBounces, setDailyBounces] = useState<DailyMetric[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics[]>([]);
  const [variantMetrics, setVariantMetrics] = useState<VariantMetrics[]>([]);
  const [senderMetrics, setSenderMetrics] = useState<SenderMetrics[]>([]);
  const [positiveReplies, setPositiveReplies] = useState<PositiveReplyItem[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [summary, setSummary] = useState<string>("");

  // Load clients on mount
  useEffect(() => {
    async function loadClients() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) {
        setError("Failed to load clients: " + error.message);
        return;
      }
      if (data && data.length > 0) {
        setClients(data);
        setFilters((f) => ({ ...f, clientId: data[0].id }));
      }
    }
    loadClients();
  }, []);

  // Load campaigns + senders when client changes
  useEffect(() => {
    if (!filters.clientId) return;
    async function loadCampaignsAndSenders() {
      const [campaignRes, senderRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*")
          .eq("client_id", filters.clientId)
          .order("name"),
        supabase
          .from("email_events")
          .select("sender_email")
          .eq("client_id", filters.clientId),
      ]);
      if (!campaignRes.error && campaignRes.data) {
        setCampaigns(campaignRes.data);
      }
      if (!senderRes.error && senderRes.data) {
        const unique = Array.from(new Set(senderRes.data.map((r) => r.sender_email))).sort();
        setSenderEmails(unique);
      }
    }
    loadCampaignsAndSenders();
  }, [filters.clientId]);

  const loadData = useCallback(async () => {
    if (!filters.clientId) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("email_events")
        .select("*")
        .eq("client_id", filters.clientId)
        .gte("created_at", filters.dateFrom)
        .lte("created_at", filters.dateTo + "T23:59:59");

      if (filters.campaignIds.length > 0) {
        query = query.in("campaign_id", filters.campaignIds);
      }
      if (filters.senderEmails.length > 0) {
        query = query.in("sender_email", filters.senderEmails);
      }

      const { data: events, error: evErr } = await query;
      if (evErr) throw new Error(evErr.message);

      const typedEvents = (events ?? []) as EmailEvent[];
      const campaignMap: Record<string, string> = {};
      for (const c of campaigns) campaignMap[c.id] = c.name;

      const kpiData = computeKPIs(
        typedEvents,
        filters.dateFrom,
        filters.dateTo,
        campaignMap
      );

      // Positive replies with lead info
      const positiveEvents = typedEvents.filter(
        (e) => e.event_type === "positive_reply" || e.interested
      );
      const leadIds = Array.from(new Set(positiveEvents.map((e) => e.lead_id).filter(Boolean))) as string[];
      let leadsMap: Record<string, { first_name: string | null; last_name: string | null; title: string | null; company: string | null; email: string }> = {};
      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, first_name, last_name, title, company, email")
          .in("id", leadIds);
        if (leadsData) {
          for (const l of leadsData) {
            leadsMap[l.id] = l;
          }
        }
      }

      const positiveReplyFeed: PositiveReplyItem[] = positiveEvents
        .sort((a, b) => {
          const da = new Date(a.replied_at ?? a.created_at).getTime();
          const db = new Date(b.replied_at ?? b.created_at).getTime();
          return db - da;
        })
        .slice(0, 50)
        .map((e) => {
          const lead = e.lead_id ? leadsMap[e.lead_id] : null;
          return {
            id: e.id,
            lead_first_name: lead?.first_name ?? null,
            lead_last_name: lead?.last_name ?? null,
            lead_title: lead?.title ?? null,
            lead_company: lead?.company ?? null,
            lead_email: lead?.email ?? "unknown@unknown.com",
            campaign_name: e.campaign_id ? (campaignMap[e.campaign_id] ?? null) : null,
            subject: e.subject,
            replied_at: e.replied_at,
            sender_email: e.sender_email,
          };
        });

      setKpis(kpiData);
      setDailySent(computeDailySent(typedEvents, filters.dateFrom, filters.dateTo));
      setDailyReplies(computeDailyReplies(typedEvents, filters.dateFrom, filters.dateTo));
      setDailyPositive(computeDailyPositiveReplies(typedEvents, filters.dateFrom, filters.dateTo));
      setDailyBounces(computeDailyBounces(typedEvents, filters.dateFrom, filters.dateTo));
      setFunnel(computeFunnel(typedEvents));
      setCampaignMetrics(computeCampaignMetrics(typedEvents, campaignMap));
      setVariantMetrics(computeVariantMetrics(typedEvents));
      setSenderMetrics(computeSenderMetrics(typedEvents));
      setPositiveReplies(positiveReplyFeed);
      const insightData = computeInsights(typedEvents, campaignMap, filters.dateFrom, filters.dateTo);
      setInsights(insightData);
      setSummary(generateSummary(kpiData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters, campaigns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClient = clients.find((c) => c.id === filters.clientId);

  const bounceStatus = kpis ? getBounceStatus(kpis.bounceRate) : "healthy";

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav
        clients={clients}
        selectedClientId={filters.clientId}
        onClientChange={(id) =>
          setFilters((f) => ({ ...f, clientId: id, campaignIds: [], senderEmails: [] }))
        }
      />

      <main className="mx-auto max-w-screen-2xl px-6 py-6 space-y-6">
        {/* Hero */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedClient?.name ?? "Loading…"} Dashboard
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {filters.dateFrom} — {filters.dateTo}
          </p>
          {summary && !loading && (
            <p className="mt-1 text-sm text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 max-w-3xl">
              {summary}
            </p>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          campaigns={campaigns}
          senderEmails={senderEmails}
          filters={filters}
          onChange={setFilters}
        />

        {error && <ErrorMessage message={error} />}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
          <KPICard
            label="Emails Sent"
            value={kpis ? formatNumber(kpis.totalSent) : "—"}
            loading={loading}
          />
          <KPICard
            label="Replies"
            value={kpis ? formatNumber(kpis.totalReplies) : "—"}
            loading={loading}
          />
          <KPICard
            label="Positive Replies"
            value={kpis ? formatNumber(kpis.totalPositiveReplies) : "—"}
            loading={loading}
          />
          <KPICard
            label="Reply Rate"
            value={kpis ? formatPct(kpis.replyRate) : "—"}
            loading={loading}
          />
          <KPICard
            label="Pos. Reply Rate"
            value={kpis ? formatPct(kpis.positiveReplyRate) : "—"}
            loading={loading}
          />
          <KPICard
            label="Bounce Rate"
            value={kpis ? formatPct(kpis.bounceRate) : "—"}
            statusClass={
              kpis
                ? BOUNCE_STATUS_COLORS[bounceStatus].split(" ").find((c) =>
                    c.startsWith("text-")
                  )
                : undefined
            }
            loading={loading}
          />
          <KPICard
            label="Avg Sent / Day"
            value={kpis ? kpis.avgSentPerDay.toFixed(0) : "—"}
            loading={loading}
          />
          <KPICard
            label="Best Campaign"
            value={
              kpis?.bestCampaignPositiveReplyRate != null
                ? formatPct(kpis.bestCampaignPositiveReplyRate)
                : "—"
            }
            subtext={kpis?.bestCampaignName ?? undefined}
            loading={loading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DailySentChart data={dailySent} loading={loading} />
          <DailyRepliesChart data={dailyReplies} loading={loading} />
          <DailyPositiveRepliesChart data={dailyPositive} loading={loading} />
          <DailyBouncesChart data={dailyBounces} loading={loading} />
        </div>

        {/* Funnel */}
        <ReplyFunnelChart data={funnel} loading={loading} />

        {/* Performance Insights */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Performance Insights
          </h2>
          <PerformanceInsights insights={insights} loading={loading} />
        </section>

        {/* Positive Reply Feed */}
        <PositiveReplyFeed data={positiveReplies} loading={loading} />

        {/* Tables */}
        <CampaignLeaderboard data={campaignMetrics} loading={loading} />
        <VariantPerformanceTable data={variantMetrics} loading={loading} />
        <SenderHealthTable data={senderMetrics} loading={loading} />
      </main>
    </div>
  );
}
