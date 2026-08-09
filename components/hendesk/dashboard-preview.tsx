"use client";

import { Sparkles, User, CheckCircle2, Search, MoreHorizontal, UserPlus } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 bg-[oklch(0.985_0.003_260)]">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="ml-4 flex-1 max-w-[260px] h-6 rounded-lg bg-background border border-border/50 flex items-center justify-center">
          <span className="text-[10px] text-foreground/30 tracking-wide">app.hendesk.io / inbox</span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] h-[400px]">
        {/* Sidebar */}
        <div className="hidden sm:flex border-r border-border/50 bg-[oklch(0.99_0.002_260)] flex-col">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-[7px] h-3.5 w-3.5 text-foreground/25" />
              <div className="pl-7 pr-2 py-1.5 text-[11px] rounded-lg bg-background border border-border/50 text-foreground/30">Search conversations…</div>
            </div>
          </div>
          <div className="px-2 flex-1 space-y-0.5">
            {[
              { name: "Amelia Chen", msg: "Can I speak to a real person?", tag: "Waiting", tagColor: "bg-amber/15 text-amber", active: true },
              { name: "Marcus Weber", msg: "How to install on Webflow?", tag: "AI", tagColor: "bg-brand/10 text-brand" },
              { name: "Priya N.", msg: "Perfect, that solved it!", tag: "Resolved", tagColor: "bg-foreground/5 text-foreground/40" },
              { name: "Joel Ibarra", msg: "Robots.txt support?", tag: "Human", tagColor: "bg-emerald/10 text-emerald" },
            ].map((c) => (
              <div key={c.name} className={`px-3 py-2.5 rounded-xl transition-colors ${c.active ? "bg-background shadow-sm border border-border/50" : "hover:bg-background/60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-brand/8 text-brand grid place-items-center text-[9px] font-bold shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[12px] font-semibold text-foreground truncate">{c.name}</span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${c.tagColor}`}>{c.tag}</span>
                </div>
                <div className="text-[11px] text-foreground/35 truncate mt-1 pl-8">{c.msg}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex flex-col bg-background">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand/8 text-brand grid place-items-center text-[11px] font-bold">AC</div>
              <div>
                <div className="text-[13px] font-semibold">Amelia Chen</div>
                <div className="text-[10px] text-foreground/35">amelia.chen@northlake.co · /pricing</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber/10 text-amber">Waiting for agent</span>
              <div className="h-7 w-7 rounded-lg bg-foreground/[0.04] grid place-items-center"><MoreHorizontal className="h-3.5 w-3.5 text-foreground/30" /></div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 space-y-4 overflow-hidden scrollbar-none">
            {/* Visitor message */}
            <div className="flex justify-end">
              <div className="max-w-[72%] rounded-2xl rounded-br-md bg-brand text-white px-4 py-2.5 text-[12px] leading-relaxed shadow-sm">
                What&apos;s your refund policy for annual plans?
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-brand/8 text-brand grid place-items-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[72%] space-y-2">
                <div className="rounded-2xl rounded-tl-md bg-[oklch(0.975_0.003_260)] px-4 py-2.5 text-[12px] leading-relaxed">
                  Annual plans include a 30-day money-back guarantee. After 30 days, refunds are prorated.
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[9px] font-medium px-2 py-1 rounded-lg bg-[oklch(0.975_0.003_260)] border border-border/40 text-foreground/40">Refund Policy.pdf</span>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-lg bg-[oklch(0.975_0.003_260)] border border-border/40 text-foreground/40">Terms §7</span>
                </div>
              </div>
            </div>

            {/* Visitor follow-up */}
            <div className="flex justify-end">
              <div className="max-w-[72%] rounded-2xl rounded-br-md bg-brand text-white px-4 py-2.5 text-[12px] leading-relaxed shadow-sm">
                Can I speak to a real person?
              </div>
            </div>

            {/* System message */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-[10px] text-foreground/30 font-medium bg-[oklch(0.975_0.003_260)] px-3 py-1.5 rounded-full">
                <User className="h-3 w-3" /> Escalation requested — agent joining…
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/50 flex items-center gap-3">
            <div className="flex-1 h-9 px-3 rounded-xl bg-[oklch(0.975_0.003_260)] border border-border/40 flex items-center text-[12px] text-foreground/25">Reply as Alex…</div>
            <button className="h-9 px-4 rounded-xl bg-emerald text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" /> Accept handoff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
