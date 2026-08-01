"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/chat/use-socket";
import { getAgentSocketToken } from "@/app/actions/chat";
import { v4 as uuidv4 } from "uuid";
import {
  Sparkles, User, Send, UserPlus, Bot, CheckCircle2, MoreHorizontal,
  Ticket, Contact, Circle, Clock, ChevronRight, Info, Headphones,
} from "lucide-react";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SocketMessage, SocketRouteChange } from "@/lib/chat/socket-events";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// MessageBubble — exact same styles as the original design
// ---------------------------------------------------------------------------
function MessageBubble({ m, visitorName }: { m: any; visitorName: string }) {
  const formattedTime = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (m.senderType === "system") {
    return (
      <div className="flex justify-center my-3.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
          <Info className="h-3 w-3 text-brand shrink-0" />
          <span>{m.content}</span>
        </div>
      </div>
    );
  }

  if (m.senderType === "visitor") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-1">
          <div className="rounded-2xl rounded-tl-xs bg-card border border-border/50 p-3.5 text-[13.5px] text-foreground leading-relaxed shadow-2xs">
            {m.content}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/45 pl-1">
            <User className="h-3.5 w-3.5 text-foreground/50" />
            <span>{visitorName}</span>
            <span className="text-[10px] text-foreground/35">· {formattedTime}</span>
          </div>
        </div>
      </div>
    );
  }

  if (m.senderType === "ai") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-1">
          <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800/80 p-3.5 text-[13.5px] text-foreground leading-relaxed shadow-2xs">
            {m.content}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/45 pl-1">
            <Bot className="h-3.5 w-3.5 text-foreground/50" />
            <span>AI Assistant</span>
            <span className="text-[10px] text-foreground/35">· {formattedTime}</span>
          </div>
          {m.citations && m.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
              {m.citations.map((c: any, i: number) => (
                <span key={i} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-card border border-border/50 text-foreground/50">
                  {c.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // agent message
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1 flex flex-col items-end">
        <div className="rounded-2xl rounded-tr-xs bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-[13.5px] text-foreground leading-relaxed shadow-2xs">
          {m.content}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pr-1">
          <span className="text-[10px] font-normal text-foreground/35">{formattedTime} ·</span>
          <span>Support Agent</span>
          <Headphones className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimelineItem
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ChatWindow — main export
// ---------------------------------------------------------------------------
export function ChatWindow({
  initialMessages,
  conversation,
  agentUserId,
  workspaceId,
  agentName,
}: {
  initialMessages: any[];
  conversation: any;
  agentUserId?: string;
  workspaceId?: string;
  agentName?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [reply, setReply] = useState("");
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [currentConvo, setCurrentConvo] = useState(conversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-sync if Server Component re-renders with new data
  useEffect(() => {
    setMessages(initialMessages);
    setCurrentConvo(conversation);
  }, [initialMessages, conversation]);

  useEffect(() => {
    async function fetchToken() {
      try {
        const result = await getAgentSocketToken();
        if (result.token) setAgentToken(result.token);
      } catch {}
    }
    fetchToken();
  }, []);

  const { socket, connected } = useSocket({
    clientType: "agent",
    token: agentToken,
    enabled: !!agentToken,
  });

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit("conversation:join", { conversationId: currentConvo._id }, () => {});
  }, [socket, connected, currentConvo._id]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated = (msg: SocketMessage) => {
      if (msg.conversationId === currentConvo._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          if (msg.clientMessageId && prev.some((m) => m.clientMessageId === msg.clientMessageId)) {
            return prev.map((m) => (m.clientMessageId === msg.clientMessageId ? { ...msg } : m));
          }
          return [...prev, msg].sort((a, b) => a.sequence - b.sequence);
        });
      }
    };

    const handleRouteChanged = (change: SocketRouteChange) => {
      if (change.conversationId === currentConvo._id) {
        setCurrentConvo((prev: any) => ({
          ...prev,
          status: change.status,
          assignedAgentUserId: change.assignedAgentUserId,
          routingVersion: change.routingVersion,
        }));
        router.refresh();
      }
    };

    socket.on("message:created", handleMessageCreated);
    socket.on("conversation:route-changed", handleRouteChanged);

    return () => {
      socket.off("message:created", handleMessageCreated);
      socket.off("conversation:route-changed", handleRouteChanged);
    };
  }, [socket, currentConvo._id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = useCallback(() => {
    if (!reply.trim() || !socket) return;

    const clientMessageId = uuidv4();
    const content = reply.trim();
    setReply("");

    const optimistic = {
      _id: `pending-${clientMessageId}`,
      conversationId: currentConvo._id,
      workspaceId,
      senderType: "agent",
      senderUserId: agentUserId,
      content,
      sequence: 999999,
      clientMessageId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    socket.emit("agent:message:send", {
      conversationId: currentConvo._id,
      content,
      clientMessageId,
    }, (res) => {
      if (!res.ok) console.error("Failed to send reply:", res.error);
    });
  }, [reply, socket, currentConvo._id, workspaceId, agentUserId]);

  const executeAction = (action: string) => {
    if (!socket) return;
    socket.emit(action as any, { conversationId: currentConvo._id }, (res: any) => {
      if (!res.ok) console.error(`Failed ${action}:`, res.error);
    });
  };

  const visitorName = currentConvo.visitor?.name || "Anonymous";
  const visitorEmail = currentConvo.visitor?.email || "";
  const visitorDevice = currentConvo.visitor?.device || "Desktop / Chrome";
  const visitorPage = currentConvo.visitor?.currentPage || "/";
  const isAssignedToMe = currentConvo.assignedAgentUserId === agentUserId;

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  // Build timeline from system messages
  const systemTimeline = messages
    .filter((m) => m.senderType === "system")
    .map((m) => ({
      label: m.content,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      icon: m.systemEventType === "handoff_requested" ? Clock
        : m.systemEventType === "agent_joined" ? UserPlus
        : m.systemEventType === "ai_resumed" ? Bot
        : m.systemEventType === "conversation_resolved" ? CheckCircle2
        : Circle,
    }));

  return (
    <>
      {/* ── Center Column: Chat Thread ── */}
      <div className="flex flex-col h-full min-w-0 bg-background overflow-hidden">
        {/* Pinned Thread Header */}
        <div className="h-16 border-b border-border/40 px-5 flex items-center justify-between gap-3 bg-card shrink-0 select-none">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight text-foreground truncate">{visitorName}</h2>
            </div>
            <p className="text-[11.5px] text-foreground/40 font-medium truncate mt-0.5">{visitorEmail} · Page: {visitorPage}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentConvo.status === "waiting" && (
              <Button size="sm" className="bg-emerald text-white hover:bg-emerald/90 rounded-full h-9 px-4 text-[13px] font-semibold shadow-xs" onClick={() => executeAction("conversation:claim")}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Accept Handoff
              </Button>
            )}
            {currentConvo.status === "human" && (
              <>
                <Button size="sm" variant="outline" className="rounded-full h-9 px-3.5 text-[12.5px] font-semibold border-border/60" onClick={() => executeAction("conversation:return-to-ai")}>
                  <Bot className="h-3.5 w-3.5 mr-1 text-brand" /> Return to AI
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-9 px-3.5 text-[12.5px] font-semibold border-border/60" onClick={() => executeAction("conversation:resolve")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald" /> Resolve
                </Button>
              </>
            )}
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-foreground/[0.05] text-foreground/60 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[oklch(0.99_0.002_260)]">
          {messages.map((m) => (
            <MessageBubble key={m._id} m={m} visitorName={visitorName} />
          ))}
          {currentConvo.status === "ai" && messages.length > 0 && messages[messages.length - 1]?.senderType === "visitor" && (
            <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-foreground/45 bg-card border border-border/50 w-fit px-3 py-1.5 rounded-full shadow-2xs">
              <div className="h-5 w-5 rounded-full bg-brand/10 text-brand grid place-items-center"><Sparkles className="h-3 w-3" /></div>
              <span>AI is generating response…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Reply Box */}
        <div className="border-t border-border/40 p-4 bg-card shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[12px] font-medium text-foreground/40">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground">Reply</span>
            </div>
            <span>Replying as <strong className="text-foreground font-semibold">{agentName || "Agent"}</strong></span>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                rows={2}
                placeholder="Type your message to customer…"
                className="resize-none rounded-2xl text-[13.5px] leading-relaxed p-3 bg-background border-border/60 focus:border-brand"
              />
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand/85 rounded-full h-11 px-6 font-semibold text-[14px] shadow-sm shrink-0 cursor-pointer"
              onClick={sendReply}
              disabled={!reply.trim() || !connected}
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Column: Visitor Profile & Timeline ── */}
      <aside className="hidden lg:flex flex-col h-full border-l border-border/40 bg-card overflow-y-auto p-5 space-y-6 select-none scrollbar-none">
        {/* Visitor Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-brand/10 text-brand grid place-items-center text-[15px] font-bold">
              {getInitials(visitorName)}
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-foreground leading-tight">{visitorName}</h3>
              <p className="text-[12px] text-foreground/45 mt-0.5">{visitorEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[oklch(0.985_0.003_260)] border border-border/40 text-[12px]">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Visitor ID</span>
              <span className="font-mono text-foreground/80 font-medium truncate block">{currentConvo._id.slice(-8)}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Device</span>
              <span className="text-foreground/80 font-medium block">{visitorDevice}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Active Page</span>
              <span className="text-brand font-semibold truncate block">{visitorPage}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Mode</span>
              <StatusBadge status={currentConvo.status} />
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block">Handoff Reason</span>
              <span className="text-foreground/75 font-medium truncate block">{currentConvo.handoffReason || "—"}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground/40">Activity Timeline</h4>
          <ol className="space-y-3 text-[12.5px]">
            <TimelineItem icon={Circle} label="Visitor started conversation" time={new Date(currentConvo.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
            {systemTimeline.map((item, i) => (
              <TimelineItem key={i} icon={item.icon} label={item.label} time={item.time} />
            ))}
          </ol>
        </div>

      </aside>
    </>
  );
}
