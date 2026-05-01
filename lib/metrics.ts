import { format, parseISO, eachDayOfInterval } from "date-fns";
import type {
  EmailEvent,
  KPIMetrics,
  DailyMetric,
  CampaignMetrics,
  VariantMetrics,
  SenderMetrics,
  FunnelStep,
  InsightCard,
} from "@/types";
import { getBounceStatus } from "./constants";

type CampaignMap = Record<string, string>;

function safeRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function computeKPIs(
  events: EmailEvent[],
  dateFrom: string,
  dateTo: string,
  campaignMap: CampaignMap
): KPIMetrics {
  const sent = events.filter((e) => e.event_type === "sent");
  const replies = events.filter((e) => e.event_type === "reply");
  const positiveReplies = events.filter(
    (e) => e.event_type === "positive_reply" || e.interested
  );
  const bounces = events.filter((e) => e.event_type === "bounce");

  const totalSent = sent.length;
  const totalReplies = replies.length;
  const totalPositiveReplies = positiveReplies.length;
  const totalBounces = bounces.length;

  const from = parseISO(dateFrom);
  const to = parseISO(dateTo);
  const days = eachDayOfInterval({ start: from, end: to }).length || 1;

  const campaignStats: Record<string, { sent: number; positive: number }> = {};
  for (const e of sent) {
    const cid = e.campaign_id ?? "__none__";
    campaignStats[cid] = campaignStats[cid] ?? { sent: 0, positive: 0 };
    campaignStats[cid].sent++;
  }
  for (const e of positiveReplies) {
    const cid = e.campaign_id ?? "__none__";
    campaignStats[cid] = campaignStats[cid] ?? { sent: 0, positive: 0 };
    campaignStats[cid].positive++;
  }

  let bestCampaignId: string | null = null;
  let bestRate = -1;
  for (const [cid, stats] of Object.entries(campaignStats)) {
    const rate = safeRate(stats.positive, stats.sent);
    if (rate > bestRate) {
      bestRate = rate;
      bestCampaignId = cid;
    }
  }

  return {
    totalSent,
    totalReplies,
    totalPositiveReplies,
    totalBounces,
    replyRate: safeRate(totalReplies, totalSent),
    positiveReplyRate: safeRate(totalPositiveReplies, totalSent),
    bounceRate: safeRate(totalBounces, totalSent),
    avgSentPerDay: totalSent / days,
    bestCampaignName:
      bestCampaignId && bestCampaignId !== "__none__"
        ? (campaignMap[bestCampaignId] ?? null)
        : null,
    bestCampaignPositiveReplyRate: bestRate >= 0 ? bestRate : null,
  };
}

function buildDailyMap(
  events: EmailEvent[],
  dateField: "sent_at" | "replied_at" | "bounced_at" | "created_at",
  dateFrom: string,
  dateTo: string
): DailyMetric[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const raw = e[dateField] ?? e.created_at;
    if (!raw) continue;
    const day = format(parseISO(raw), "yyyy-MM-dd");
    counts[day] = (counts[day] ?? 0) + 1;
  }

  const days = eachDayOfInterval({
    start: parseISO(dateFrom),
    end: parseISO(dateTo),
  });

  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: key, count: counts[key] ?? 0 };
  });
}

export function computeDailySent(
  events: EmailEvent[],
  dateFrom: string,
  dateTo: string
): DailyMetric[] {
  return buildDailyMap(
    events.filter((e) => e.event_type === "sent"),
    "sent_at",
    dateFrom,
    dateTo
  );
}

export function computeDailyReplies(
  events: EmailEvent[],
  dateFrom: string,
  dateTo: string
): DailyMetric[] {
  return buildDailyMap(
    events.filter((e) => e.event_type === "reply"),
    "replied_at",
    dateFrom,
    dateTo
  );
}

export function computeDailyPositiveReplies(
  events: EmailEvent[],
  dateFrom: string,
  dateTo: string
): DailyMetric[] {
  return buildDailyMap(
    events.filter((e) => e.event_type === "positive_reply" || e.interested),
    "replied_at",
    dateFrom,
    dateTo
  );
}

export function computeDailyBounces(
  events: EmailEvent[],
  dateFrom: string,
  dateTo: string
): DailyMetric[] {
  return buildDailyMap(
    events.filter((e) => e.event_type === "bounce"),
    "bounced_at",
    dateFrom,
    dateTo
  );
}

export function computeCampaignMetrics(
  events: EmailEvent[],
  campaignMap: CampaignMap
): CampaignMetrics[] {
  const stats: Record<
    string,
    { sent: number; replies: number; positive: number; bounces: number }
  > = {};

  for (const e of events) {
    const cid = e.campaign_id ?? "__none__";
    stats[cid] = stats[cid] ?? { sent: 0, replies: 0, positive: 0, bounces: 0 };
    if (e.event_type === "sent") stats[cid].sent++;
    else if (e.event_type === "reply") stats[cid].replies++;
    else if (e.event_type === "positive_reply" || e.interested) stats[cid].positive++;
    else if (e.event_type === "bounce") stats[cid].bounces++;
  }

  return Object.entries(stats)
    .map(([cid, s]) => ({
      campaign_id: cid,
      campaign_name: campaignMap[cid] ?? "Unknown Campaign",
      sent: s.sent,
      replies: s.replies,
      positive_replies: s.positive,
      bounces: s.bounces,
      reply_rate: safeRate(s.replies, s.sent),
      positive_reply_rate: safeRate(s.positive, s.sent),
      bounce_rate: safeRate(s.bounces, s.sent),
    }))
    .sort((a, b) => b.positive_reply_rate - a.positive_reply_rate);
}

export function computeVariantMetrics(events: EmailEvent[]): VariantMetrics[] {
  const key = (e: EmailEvent) =>
    `${e.subject ?? ""}||${e.step_order ?? ""}||${e.step_variant ?? ""}`;

  const stats: Record<
    string,
    {
      subject: string;
      step_order: number | null;
      step_variant: string | null;
      sent: number;
      replies: number;
      positive: number;
      bounces: number;
    }
  > = {};

  for (const e of events) {
    const k = key(e);
    stats[k] = stats[k] ?? {
      subject: e.subject ?? "N/A",
      step_order: e.step_order,
      step_variant: e.step_variant,
      sent: 0,
      replies: 0,
      positive: 0,
      bounces: 0,
    };
    if (e.event_type === "sent") stats[k].sent++;
    else if (e.event_type === "reply") stats[k].replies++;
    else if (e.event_type === "positive_reply" || e.interested) stats[k].positive++;
    else if (e.event_type === "bounce") stats[k].bounces++;
  }

  return Object.values(stats)
    .map((s) => ({
      subject: s.subject,
      step_order: s.step_order,
      step_variant: s.step_variant,
      sent: s.sent,
      replies: s.replies,
      positive_replies: s.positive,
      reply_rate: safeRate(s.replies, s.sent),
      positive_reply_rate: safeRate(s.positive, s.sent),
      bounce_rate: safeRate(s.bounces, s.sent),
    }))
    .sort((a, b) => b.positive_reply_rate - a.positive_reply_rate);
}

export function computeSenderMetrics(events: EmailEvent[]): SenderMetrics[] {
  const stats: Record<
    string,
    { sent: number; replies: number; positive: number; bounces: number }
  > = {};

  for (const e of events) {
    const s = e.sender_email;
    stats[s] = stats[s] ?? { sent: 0, replies: 0, positive: 0, bounces: 0 };
    if (e.event_type === "sent") stats[s].sent++;
    else if (e.event_type === "reply") stats[s].replies++;
    else if (e.event_type === "positive_reply" || e.interested) stats[s].positive++;
    else if (e.event_type === "bounce") stats[s].bounces++;
  }

  return Object.entries(stats)
    .map(([email, s]) => {
      const bounceRate = safeRate(s.bounces, s.sent);
      return {
        sender_email: email,
        sent: s.sent,
        replies: s.replies,
        positive_replies: s.positive,
        bounces: s.bounces,
        bounce_rate: bounceRate,
        status: getBounceStatus(bounceRate),
      };
    })
    .sort((a, b) => b.bounces - a.bounces);
}

export function computeFunnel(
  events: EmailEvent[]
): FunnelStep[] {
  const sent = events.filter((e) => e.event_type === "sent").length;
  const replies = events.filter((e) => e.event_type === "reply").length;
  const positiveReplies = events.filter(
    (e) => e.event_type === "positive_reply" || e.interested
  ).length;

  return [
    { name: "Sent", value: sent, conversionRate: 1 },
    {
      name: "Replies",
      value: replies,
      conversionRate: safeRate(replies, sent),
    },
    {
      name: "Positive Replies",
      value: positiveReplies,
      conversionRate: safeRate(positiveReplies, sent),
    },
  ];
}

export function computeInsights(
  events: EmailEvent[],
  campaignMap: CampaignMap,
  dateFrom: string,
  dateTo: string
): InsightCard[] {
  const insights: InsightCard[] = [];

  const dailyPositive = computeDailyPositiveReplies(events, dateFrom, dateTo);
  if (dailyPositive.length > 0) {
    const best = dailyPositive.reduce((a, b) => (a.count >= b.count ? a : b));
    insights.push({
      title: "Best Day",
      value: best.count.toString(),
      subtitle: `Positive replies on ${best.date}`,
      type: "positive",
    });
  }

  const campaignMetrics = computeCampaignMetrics(events, campaignMap);
  if (campaignMetrics.length > 0) {
    const best = campaignMetrics[0];
    insights.push({
      title: "Top Campaign",
      value: `${(best.positive_reply_rate * 100).toFixed(1)}%`,
      subtitle: `Positive reply rate — ${best.campaign_name}`,
      type: "positive",
    });

    const worstByReplyRate = campaignMetrics
      .filter((c) => c.sent >= 50)
      .sort((a, b) => a.reply_rate - b.reply_rate)[0];
    if (worstByReplyRate && worstByReplyRate.reply_rate < 0.03) {
      insights.push({
        title: "Low Reply Rate",
        value: `${(worstByReplyRate.reply_rate * 100).toFixed(1)}%`,
        subtitle: `High volume, low replies — ${worstByReplyRate.campaign_name}`,
        type: "warning",
      });
    }
  }

  const senderMetrics = computeSenderMetrics(events);
  const worstSender = [...senderMetrics].sort(
    (a, b) => b.bounce_rate - a.bounce_rate
  )[0];
  if (worstSender && worstSender.bounce_rate > 0) {
    insights.push({
      title: "Highest Bounce Rate",
      value: `${(worstSender.bounce_rate * 100).toFixed(1)}%`,
      subtitle: `Sender: ${worstSender.sender_email}`,
      type: worstSender.status === "critical" ? "warning" : "neutral",
    });
  }

  const avgVariantRate =
    computeVariantMetrics(events).reduce(
      (sum, v) => sum + v.positive_reply_rate,
      0
    ) / (computeVariantMetrics(events).length || 1);

  const topVariant = computeVariantMetrics(events).find(
    (v) => v.positive_reply_rate > avgVariantRate && v.sent >= 10
  );
  if (topVariant) {
    insights.push({
      title: "Top Subject Line",
      value: `${(topVariant.positive_reply_rate * 100).toFixed(1)}%`,
      subtitle:
        topVariant.subject.length > 40
          ? topVariant.subject.slice(0, 40) + "…"
          : topVariant.subject,
      type: "positive",
    });
  }

  return insights;
}

export function generateSummary(kpis: KPIMetrics): string {
  const parts: string[] = [];

  if (kpis.positiveReplyRate > 0.03) {
    parts.push("Positive replies are performing well this period.");
  } else if (kpis.positiveReplyRate > 0) {
    parts.push("Positive reply rate has room to improve.");
  } else {
    parts.push("No positive replies recorded yet for this period.");
  }

  if (kpis.bounceRate < 0.02) {
    parts.push("Bounce rate is healthy.");
  } else if (kpis.bounceRate < 0.05) {
    parts.push("Bounce rate is in the warning zone — monitor sender health.");
  } else {
    parts.push("Bounce rate is critical — immediate action recommended.");
  }

  if (kpis.bestCampaignName) {
    parts.push(
      `Best-performing campaign: ${kpis.bestCampaignName} at ${((kpis.bestCampaignPositiveReplyRate ?? 0) * 100).toFixed(1)}% positive reply rate.`
    );
  }

  return parts.join(" ");
}
