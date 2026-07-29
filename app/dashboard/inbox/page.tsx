"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { conversations as seed, type Conversation, type ConvStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  User,
  Send,
  Search,
  MoreHorizontal,
  Filter,
  UserPlus,
  Bot,
  CheckCircle2,
  Ticket,
  Contact,
  Circle,
  Clock,
  Paperclip,
  Smile,
  ShieldCheck,
  ChevronRight,
  Zap,
} from "lucide-react";

const filters: { k: string; label: string }[] = [
  { k: "all", label: "All" },
  { k: "unassigned", label: "Unassigned" },
  { k: "ai", label: "AI" },
  { k: "human", label: "Human" },
  { k: "mine", label: "Assigned to me" },
  { k: "resolved", label: "Resolved" },
];

export default function InboxPage() {
  const [convs, setConvs] = useState<Conversation[]>(seed);
  const [selectedId, setSelectedId] = useState<string>(seed[0].id);
  const [filter, setFilter] = useState("all");
  const [reply, setReply] = useState("");

  const list = useMemo(() => convs.filter((c) => {
    if (filter === "all") return true;
    if (filter === "unassigned") return !c.assignedTo && c.status !== "resolved";
    if (filter === "mine") return c.assignedTo === "You";
    if (filter === "resolved") return c.status === "resolved";
    if (filter === "ai") return c.status === "ai";
    if (filter === "human") return c.status === "human";
    return true;
  }), [convs, filter]);

  const active = convs.find((c) => c.id === selectedId) ?? convs[0];

  const setStatus = (id: string, status: ConvStatus, assign?: string) =>
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, status, assignedTo: assign ?? c.assignedTo } : c)));

  const sendReply = () => {
    if (!reply.trim()) return;
    setConvs((cs) => cs.map((c) => c.id === active.id ? {
      ...c, status: "human", assignedTo: "You",
      messages: [...c.messages, { id: Math.random().toString(), role: "agent", content: reply, time: "now" }],
    } : c));
    setReply("");
  };

  return (
    <div className="h-[calc(100vh-68px)] sm:h-[calc(100vh-72px)] overflow-hidden grid grid-cols-1 md:grid-cols-[310px_minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)_340px] bg-background">
      
      {/* ── Left Column: Conversation List ── */}
      <div className="border-r border-border/40 flex flex-col h-full min-w-0 bg-card select-none">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-border/40 space-y-3 bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/35" />
            <Input
              placeholder="Search conversations…"
              className="pl-9 h-9 rounded-xl text-[13px] bg-background border-border/50"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {filters.map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={cn(
                  "text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer",
                  filter === f.k
                    ? "bg-brand text-white shadow-xs"
                    : "text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30 scrollbar-none">
          {list.length === 0 && (
            <div className="p-10 text-center text-[13px] text-foreground/40 space-y-2">
              <Filter className="h-6 w-6 mx-auto opacity-40 text-brand" />
              <p>No conversations match this filter.</p>
            </div>
          )}
          {list.map((c) => {
            const isSelected = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full text-left p-3.5 transition-all duration-200 cursor-pointer block",
                  isSelected
                    ? "bg-brand/[0.06] border-l-4 border-l-brand"
                    : "hover:bg-foreground/[0.02]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8.5 w-8.5 rounded-full bg-brand/10 text-brand grid place-items-center text-[11.5px] font-bold shrink-0">
                    {c.visitor.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold text-foreground truncate">{c.visitor}</span>
                      <span className="text-[11px] text-foreground/40 font-medium shrink-0">{c.time}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-foreground/50 truncate leading-snug">{c.preview}</p>
                    <div className="mt-2 flex items-center justify-between gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.assignedTo && <span className="text-[11px] font-medium text-foreground/40">· {c.assignedTo}</span>}
                      {c.unread && <span className="ml-auto h-2 w-2 rounded-full bg-brand" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center Column: Chat Thread (Independent Scroll) ── */}
      <div className="flex flex-col h-full min-w-0 bg-background">
        {/* Pinned Thread Header */}
        <div className="h-[64px] border-b border-border/40 px-5 flex items-center justify-between gap-3 bg-card shrink-0 select-none">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight text-foreground truncate">{active.visitor}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald uppercase tracking-wider">Online</span>
            </div>
            <p className="text-[11.5px] text-foreground/40 font-medium truncate mt-0.5">{active.email} · Page: {active.page}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {active.status === "waiting" && (
              <Button size="sm" className="bg-emerald text-white hover:bg-emerald/90 rounded-full h-9 px-4 text-[13px] font-semibold shadow-xs" onClick={() => setStatus(active.id, "human", "You")}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Accept Handoff
              </Button>
            )}
            <Button size="sm" variant="outline" className="rounded-full h-9 px-3.5 text-[12.5px] font-semibold border-border/60" onClick={() => setStatus(active.id, "ai")}>
              <Bot className="h-3.5 w-3.5 mr-1 text-brand" /> Return to AI
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-9 px-3.5 text-[12.5px] font-semibold border-border/60" onClick={() => setStatus(active.id, "resolved")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald" /> Resolve
            </Button>
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-foreground/[0.05] text-foreground/60 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[oklch(0.99_0.002_260)]">
          {active.messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
          {active.status === "ai" && (
            <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-foreground/45 bg-card border border-border/50 w-fit px-3 py-1.5 rounded-full shadow-2xs">
              <div className="h-5 w-5 rounded-full bg-brand/10 text-brand grid place-items-center"><Sparkles className="h-3 w-3" /></div>
              <span>AI is generating response…</span>
            </div>
          )}
        </div>

        {/* Pinned Reply Box */}
        <div className="border-t border-border/40 p-4 bg-card shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[12px] font-medium text-foreground/40">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground hover:underline cursor-pointer">Reply</span>
              <span className="hover:text-foreground cursor-pointer">Internal Note</span>
            </div>
            <span>Replying as <strong className="text-foreground font-semibold">Alex Rivera</strong></span>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Type your message to customer…"
                className="resize-none rounded-2xl text-[13.5px] leading-relaxed p-3 bg-background border-border/60 focus:border-brand"
              />
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand/85 rounded-full h-11 px-6 font-semibold text-[14px] shadow-sm shrink-0 cursor-pointer"
              onClick={sendReply}
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Column: Visitor Profile & Timeline (Independent Scroll) ── */}
      <aside className="hidden lg:flex flex-col h-full border-l border-border/40 bg-card overflow-y-auto p-5 space-y-6 select-none scrollbar-none">
        {/* Visitor Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-brand/10 text-brand grid place-items-center text-[15px] font-bold">
              {active.visitor.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-foreground leading-tight">{active.visitor}</h3>
              <p className="text-[12px] text-foreground/45 mt-0.5">{active.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[oklch(0.985_0.003_260)] border border-border/40 text-[12px]">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Visitor ID</span>
              <span className="font-mono text-foreground/80 font-medium truncate block">v_{active.id}·8a2c</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Device</span>
              <span className="text-foreground/80 font-medium block">{active.device}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Active Page</span>
              <span className="text-brand font-semibold truncate block">{active.page}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Mode</span>
              <StatusBadge status={active.status} />
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Handoff Reason</span>
              <span className="text-foreground/75 font-medium truncate block">{active.reason ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground/40">Activity Timeline</h4>
          <ol className="space-y-3 text-[12.5px]">
            <TimelineItem icon={Circle} label="Visitor started conversation" time="10:41 AM" />
            <TimelineItem icon={Bot} label="AI answered with 2 sources" time="10:41 AM" />
            <TimelineItem icon={Clock} label="Escalation requested" time="10:43 AM" />
          </ol>
        </div>

        {/* Related Knowledge */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground/40">Knowledge Sources Cited</h4>
          <div className="space-y-2">
            {["Refund Policy.pdf", "Terms of Service §7", "Billing FAQ"].map((s) => (
              <div key={s} className="text-[12.5px] font-medium px-3 py-2 rounded-xl bg-[oklch(0.985_0.003_260)] border border-border/40 text-foreground/75 flex items-center justify-between">
                <span className="truncate">{s}</span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 mt-auto border-t border-border/40 space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start rounded-xl h-10 border-border/60 text-[13px] font-semibold">
            <Ticket className="h-4 w-4 mr-2 text-brand" /> Create Ticket
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start rounded-xl h-10 border-border/60 text-[13px] font-semibold">
            <Contact className="h-4 w-4 mr-2 text-amber" /> Capture Lead
          </Button>
          <Button size="sm" className="w-full justify-start rounded-xl h-10 bg-emerald text-white hover:bg-emerald/90 text-[13px] font-semibold shadow-xs" onClick={() => setStatus(active.id, "resolved")}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Resolve Conversation
          </Button>
        </div>
      </aside>
    </div>
  );
}

function TimelineItem({ icon: Icon, label, time }: { icon: any; label: string; time: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <div className="h-6 w-6 rounded-full bg-muted grid place-items-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-foreground/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-foreground font-medium truncate">{label}</div>
        <div className="text-[11px] text-foreground/40">{time}</div>
      </div>
    </li>
  );
}

function MessageBubble({ m }: { m: any }) {
  if (m.role === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="text-[11.5px] font-medium text-foreground/50 bg-card border border-border/50 rounded-full px-4 py-1.5 shadow-2xs">
          {m.content}
        </div>
      </div>
    );
  }

  if (m.role === "visitor") {
    return (
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-foreground/60 shrink-0 font-bold text-[11px]">
          <User className="h-4 w-4" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tl-xs bg-card border border-border/50 p-3.5 text-[13.5px] text-foreground leading-relaxed shadow-2xs">
            {m.content}
          </div>
          <div className="text-[11px] font-medium text-foreground/35 mt-1.5 ml-1">Visitor · {m.time}</div>
        </div>
      </div>
    );
  }

  if (m.role === "ai") {
    return (
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="h-8 w-8 rounded-full bg-brand/10 text-brand grid place-items-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tl-xs bg-brand/[0.04] border border-brand/20 p-3.5 text-[13.5px] text-foreground leading-relaxed">
            {m.content}
          </div>
          {m.citations && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.citations.map((c: any, i: number) => (
                <span key={i} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-card border border-border/50 text-foreground/50">
                  {c.title}
                </span>
              ))}
            </div>
          )}
          <div className="text-[11px] font-medium text-foreground/35 mt-1.5 ml-1">AI Agent · {m.time}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-[80%] ml-auto justify-end">
      <div className="text-right">
        <div className="rounded-2xl rounded-tr-xs bg-brand text-white p-3.5 text-[13.5px] leading-relaxed shadow-xs">
          {m.content}
        </div>
        <div className="text-[11px] font-medium text-foreground/35 mt-1.5 mr-1">Agent (Alex) · {m.time}</div>
      </div>
      <div className="h-8 w-8 rounded-full bg-emerald text-white grid place-items-center text-[11px] font-bold shrink-0">
        AR
      </div>
    </div>
  );
}
