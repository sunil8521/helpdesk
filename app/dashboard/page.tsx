"use client";

import Link from "next/link";
import { WidgetPreview } from "@/components/hendesk/widget-preview";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { conversations } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Bot,
  UserCheck,
  Clock,
  Database,
  Globe,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function KPICard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
  accentBg,
  accentColor,
}: {
  icon: any;
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down";
  accentBg?: string;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs hover:border-brand/30 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-foreground/50">{label}</span>
        <div className={`h-8 w-8 rounded-xl ${accentBg || "bg-brand/8"} ${accentColor || "text-brand"} grid place-items-center`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-[24px] sm:text-[26px] font-bold tracking-tight text-foreground">{value}</div>
        {delta && (
          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
            tone === "down" ? "bg-red-50 text-red-600" : "bg-emerald/10 text-emerald"
          }`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const checklist = [
    { label: "Add your website URL", done: true },
    { label: "Upload knowledge documents", done: true },
    { label: "Customize widget appearance", done: true },
    { label: "Copy the install script", done: false },
    { label: "Invite a teammate", done: false },
  ];

  return (
    <div className="p-5 sm:p-8 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            Workspace Dashboard
          </span>
          <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Acme Co. <em className="font-display not-italic italic text-brand">workspace</em>
          </h1>
          <p className="mt-1 text-[14.5px] text-foreground/50">Welcome back, Alex! Here is your AI support performance overview.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/widget"
            className="px-5 h-11 rounded-full bg-brand   border border-border/60 text-[14px] font-semibold text-white hover:text-foreground hover:border-foreground/20 flex items-center gap-2 transition-all shadow-2xs"
          >
            <span>Customize Widget</span>
          </Link>
        
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={MessageSquare} label="Conversations" value="1,284" delta="+12%" accentBg="bg-brand/8" accentColor="text-brand" />
        <KPICard icon={Bot} label="AI Resolved" value="978" delta="+8%" accentBg="bg-purple-50" accentColor="text-purple-600" />
        <KPICard icon={UserCheck} label="Human Handoffs" value="212" delta="+4%" accentBg="bg-amber/10" accentColor="text-amber" />
        <KPICard icon={Clock} label="Avg Response" value="1m 48s" delta="-11%" accentBg="bg-emerald/10" accentColor="text-emerald" />
        <KPICard icon={Database} label="Knowledge Chunks" value="1,904" accentBg="bg-blue-50" accentColor="text-blue-600" />
        <KPICard icon={Globe} label="Active Crawls" value="1" accentBg="bg-emerald/10" accentColor="text-emerald" />
      </div>

      {/* Main Content Split: Table + Sidebar Stats */}
      <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-6">
        {/* Recent Conversations Table */}
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xs flex flex-col justify-between">
          <div>
            <div className="px-6 py-4.5 border-b border-border/40 flex items-center justify-between bg-card">
              <div>
                <h3 className="font-bold text-[16px] tracking-tight">Recent Conversations</h3>
                <p className="text-[12.5px] text-foreground/45 mt-0.5">Live incoming customer chats</p>
              </div>
              <Link href="/dashboard/inbox" className="text-[13px] font-semibold text-brand hover:underline inline-flex items-center gap-1">
                Open Inbox <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead className="bg-[oklch(0.985_0.003_260)] text-[11.5px] uppercase tracking-wider text-foreground/40 font-semibold border-b border-border/40">
                  <tr>
                    <th className="text-left font-semibold px-6 py-3">Visitor</th>
                    <th className="text-left font-semibold px-6 py-3">Last Message</th>
                    <th className="text-left font-semibold px-6 py-3">Status</th>
                    <th className="text-left font-semibold px-6 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {conversations.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-brand/8 text-brand font-bold text-[11px] grid place-items-center">
                            {c.visitor.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span>{c.visitor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-foreground/50 truncate max-w-[280px]">{c.preview}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-3.5 text-foreground/40 font-medium text-[12.5px]">{c.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-border/40 bg-[oklch(0.985_0.003_260)] text-center">
            <Link href="/dashboard/inbox" className="text-[13px] font-bold text-brand hover:underline inline-flex items-center gap-1">
              View all 1,284 conversations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Sidebar: AI Performance & Checklist */}
        <div className="space-y-6">
          {/* AI Performance Card */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] tracking-tight">AI Performance</h3>
              <span className="text-[11px] font-bold text-emerald bg-emerald/10 px-2.5 py-0.5 rounded-full">Healthy</span>
            </div>
            <div className="space-y-3.5 pt-1">
              <Row label="Resolution rate" value="76.2%" bar={76} />
              <Row label="Cited answers" value="91.0%" bar={91} tone="emerald" />
              <Row label="Handoff rate" value="16.5%" bar={16} tone="amber" />
            </div>
          </div>

          {/* Setup Checklist */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] tracking-tight">Setup Checklist</h3>
              <span className="text-[12px] font-semibold text-foreground/40">3 of 5 done</span>
            </div>
            <ul className="space-y-2.5 pt-1">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-[13.5px]">
                  {c.done ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald shrink-0" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-foreground/30 shrink-0" />
                  )}
                  <span className={cn("font-medium", c.done ? "text-foreground/45 line-through" : "text-foreground")}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Live Widget Preview Banner Section */}
      <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card via-[oklch(0.985_0.003_260)] to-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="space-y-2 max-w-md">
          <span className="text-[11.5px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            Live Widget Preview
          </span>
          <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight leading-snug">
            This is what your website visitors <em className="font-display not-italic italic text-brand">see live</em>
          </h2>
          <p className="text-[14px] text-foreground/50 leading-relaxed">
            Adjust colors, position, greeting messages, and AI responses in your{" "}
            <Link href="/dashboard/widget" className="text-brand font-semibold hover:underline">Widget Settings</Link>.
          </p>
        </div>
        <div className="shrink-0">
          <WidgetPreview compact />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bar, tone }: { label: string; value: string; bar: number; tone?: "emerald" | "amber" }) {
  const c = tone === "emerald" ? "bg-emerald" : tone === "amber" ? "bg-amber" : "bg-brand";
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] font-medium">
        <span className="text-foreground/60">{label}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${c} rounded-full transition-all duration-500`} style={{ width: `${bar}%` }} />
      </div>
    </div>
  );
}
