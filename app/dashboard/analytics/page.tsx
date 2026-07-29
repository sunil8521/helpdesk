"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MessageSquare,
  Bot,
  UserCheck,
  Clock,
  Star,
  FileText,
  HelpCircle,
  BarChart2,
  ArrowUpRight,
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            Performance Metrics
          </span>
          <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Analytics &amp; <em className="font-display not-italic italic text-brand">Insights</em>
          </h1>
          <p className="mt-1 text-[14.5px] text-foreground/50">Track AI resolution efficiency, handoff frequencies, and customer satisfaction metrics.</p>
        </div>

        <Button variant="outline" className="rounded-full h-11 px-5 font-semibold text-[14px] border-border/60 cursor-pointer shadow-2xs">
          <Calendar className="h-4 w-4 mr-2 text-brand" /> Last 30 Days
        </Button>
      </div>

      {/* KPI Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Sparkles} label="AI Resolution Rate" value="76.2%" delta="+3.4pt" up accentBg="bg-brand/8" accentColor="text-brand" />
        <MetricCard icon={UserCheck} label="Human Handoff Rate" value="16.5%" delta="-1.1pt" up accentBg="bg-amber/10" accentColor="text-amber" />
        <MetricCard icon={Clock} label="Avg Response Speed" value="1m 48s" delta="-14s" up accentBg="bg-emerald/10" accentColor="text-emerald" />
        <MetricCard icon={Star} label="CSAT Satisfaction" value="4.6 / 5" delta="+0.2" up accentBg="bg-purple-50" accentColor="text-purple-600" />
      </div>

      {/* Conversation Volume Chart */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h3 className="font-bold text-[18px] tracking-tight">Conversation Volume Trend</h3>
            <p className="text-[13px] text-foreground/45 mt-0.5">Daily breakdown of AI vs Human handled chats</p>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-semibold">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-brand" /> AI Resolved
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald" /> Human Agent
            </span>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-2">
          <div className="h-60 flex items-end gap-2.5 sm:gap-3">
            {[42, 58, 51, 63, 72, 60, 79, 88, 74, 92, 80, 96, 84, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group cursor-pointer">
                {/* Human portion */}
                <div
                  className="rounded-t-sm bg-emerald transition-all group-hover:opacity-80"
                  style={{ height: `${h * 0.22}%` }}
                />
                {/* AI portion */}
                <div
                  className="rounded-b-sm bg-brand transition-all group-hover:opacity-90"
                  style={{ height: `${h * 0.75}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11.5px] font-semibold text-foreground/40 flex justify-between border-t border-border/30 pt-2">
            {["Jun 20", "Jun 24", "Jun 28", "Jul 2", "Jul 6", "Jul 10", "Jul 14"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Split: Knowledge Sources & Top Questions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Knowledge Sources */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-bold text-[16px] tracking-tight flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-brand" /> Top Cited Knowledge Sources
            </h3>
            <span className="text-[12px] font-semibold text-foreground/40">Citations</span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { s: "Refund Policy.pdf", n: 184, p: 95 },
              { s: "acme.co/docs/install/webflow", n: 152, p: 78 },
              { s: "Product FAQ.pdf", n: 121, p: 62 },
              { s: "Onboarding Guide.md", n: 98, p: 50 },
              { s: "Terms of Service §7", n: 72, p: 37 },
            ].map((r) => (
              <div key={r.s} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-bold text-foreground truncate pr-2">{r.s}</span>
                  <span className="font-mono font-bold text-brand shrink-0">{r.n} cites</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${r.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Asked Questions */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-bold text-[16px] tracking-tight flex items-center gap-2">
              <HelpCircle className="h-4.5 w-4.5 text-amber" /> Most Frequent Customer Queries
            </h3>
            <span className="text-[12px] font-semibold text-foreground/40">Frequency</span>
          </div>

          <ul className="space-y-3 pt-1">
            {[
              { q: "What is your refund policy for annual plans?", n: 124 },
              { q: "How do I install the widget on Webflow?", n: 106 },
              { q: "Where can I configure VAT details on invoices?", n: 88 },
              { q: "Does the crawler respect robots.txt rules?", n: 70 },
              { q: "Can I use custom Gemini model keys?", n: 52 },
            ].map((item, idx) => (
              <li key={item.q} className="p-3 rounded-2xl bg-[oklch(0.985_0.003_260)] border border-border/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-5 w-5 rounded-full bg-brand/10 text-brand font-bold text-[10px] grid place-items-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground truncate">{item.q}</span>
                </div>
                <span className="text-[12px] font-mono font-bold text-foreground/50 shrink-0">{item.n} chats</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  up,
  accentBg,
  accentColor,
}: {
  icon: any;
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  accentBg?: string;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-foreground/45">{label}</span>
        <div className={`h-8 w-8 rounded-xl ${accentBg || "bg-brand/8"} ${accentColor || "text-brand"} grid place-items-center`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-[24px] sm:text-[26px] font-bold tracking-tight text-foreground">{value}</div>
        <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">
          <TrendingUp className="h-3 w-3" /> {delta}
        </span>
      </div>
    </div>
  );
}
