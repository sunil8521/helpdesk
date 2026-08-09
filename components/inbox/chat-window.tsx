"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/chat/use-socket";
import { getAgentSocketToken } from "@/app/actions/chat";
import { v4 as uuidv4 } from "uuid";
import {
  Sparkles, User, Send, UserPlus, Bot, CheckCircle2, MoreHorizontal,
  Circle, Clock, Info, Headphones, ArrowLeft, X,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="text-foreground font-medium leading-snug">{label}</div>
        <div className="text-[11px] text-foreground/40 mt-0.5">{time}</div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// ChatWindow — main export
// ---------------------------------------------------------------------------
export function ChatWindow({
  initialMessages,
  conversation: initialConvo,
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
  const [currentConvo, setCurrentConvo] = useState<any>(initialConvo);
  const [reply, setReply] = useState("");
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-sync if Server Component re-renders with new data
  useEffect(() => {
    setMessages(initialMessages);
    setCurrentConvo(initialConvo);
  }, [initialMessages, initialConvo]);

  useEffect(() => {
    async function fetchToken() {
      try {
        const result = await getAgentSocketToken();
        if (result.token) setAgentToken(result.token);
      } catch { }
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
    socket.emit("conversation:join", { conversationId: currentConvo._id }, () => { });
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

  const visitorName = currentConvo.visitor?.name
  const visitorEmail = currentConvo.visitor?.email
  const visitorDevice = currentConvo.visitor?.device
  const visitorPage = currentConvo.visitor?.currentPage

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
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background overflow-hidden">
        {/* Pinned Thread Header */}
        <div className="h-16 border-b border-border/40 px-3.5 sm:px-5 flex items-center justify-between gap-2.5 bg-card shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/dashboard/inbox"
              className="md:hidden p-1.5 rounded-xl text-foreground/70 hover:bg-muted transition-colors shrink-0"
              title="Back to all conversations"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[14.5px] sm:text-[15px] font-bold tracking-tight text-foreground truncate">{visitorName}</h2>
              </div>
              <p className="text-[11px] sm:text-[11.5px] text-foreground/40 font-medium truncate mt-0.5">{visitorEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentConvo.status === "waiting" && (
              <Button size="sm" className="bg-emerald text-white hover:bg-emerald/90 rounded-full h-8.5 sm:h-9 px-3 sm:px-4 text-[12px] sm:text-[13px] font-semibold shadow-xs" onClick={() => executeAction("conversation:claim")}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Accept Handoff
              </Button>
            )}
            {currentConvo.status === "human" && (
              <>
                <Button size="sm" variant="outline" className="rounded-full h-8.5 sm:h-9 px-2.5 sm:px-3.5 text-[11.5px] sm:text-[12.5px] font-semibold border-border/60" onClick={() => executeAction("conversation:return-to-ai")}>
                  <Bot className="h-3.5 w-3.5 mr-1 text-brand" /> <span className="hidden sm:inline">Return to </span>AI
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8.5 sm:h-9 px-2.5 sm:px-3.5 text-[11.5px] sm:text-[12.5px] font-semibold border-border/60" onClick={() => executeAction("conversation:resolve")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald" /> Resolve
                </Button>
              </>
            )}
            <button
              onClick={() => setShowMobileDetails(!showMobileDetails)}
              className="lg:hidden h-8.5 w-8.5 grid place-items-center rounded-full hover:bg-foreground/[0.05] text-foreground/70 transition-colors"
              title="Visitor Details"
            >
              <Info className="h-4 w-4 text-brand" />
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

            <span>Replying as <strong className="text-foreground font-semibold">{agentName || "Agent"}</strong></span>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                rows={2}
                disabled={currentConvo.status === "resolved" || currentConvo.status === "ai"}
                placeholder={currentConvo.status === "resolved" ? "Conversation resolved" : currentConvo.status === "ai" ? "AI is handling this conversation" : "Type your message to customer…"}
                className="resize-none rounded-2xl text-[13.5px] leading-relaxed p-3 bg-background border-border/60 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand/85 rounded-full h-11 px-6 font-semibold text-[14px] shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={sendReply}
              disabled={!reply.trim() || !connected || currentConvo.status === "resolved" || currentConvo.status === "ai"}
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Column: Visitor Profile & Timeline ── */}
      <aside className="hidden lg:flex flex-col h-full border-l border-border/40 bg-card select-none overflow-hidden w-[340px] shrink-0">
        {/* Visitor Card (Pinned) */}
        <div className="p-5 space-y-4 shrink-0">
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
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1">Active Page</span>
              <span className="text-brand font-semibold break-all block leading-tight">
                {(() => {
                  if (!visitorPage) return "Unknown";
                  try {
                    const url = new URL(visitorPage);
                    return url.pathname + url.search + url.hash || "/";
                  } catch (e) {
                    return visitorPage;
                  }
                })()}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1">Mode</span>
                <StatusBadge status={currentConvo.status} />
              </div>
            </div>
            {currentConvo.handoffReason && (
              <div className="col-span-2 mt-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1.5">Handoff Reason</span>
                <div className="bg-card/60 border border-border/50 rounded-xl p-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="text-foreground/75 font-medium leading-relaxed block text-[12.5px] italic">"{currentConvo.handoffReason}"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline (Scrollable) */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-5">
          <div className="space-y-3 pt-5 border-t border-border/40">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground/40">Activity Timeline</h4>
            <ol className="space-y-3 text-[12.5px]">
              <TimelineItem icon={Circle} label="Visitor started conversation" time={currentConvo.createdAt ? new Date(currentConvo.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown"} />
              {systemTimeline.map((item, i) => (
                <TimelineItem key={i} icon={item.icon} label={item.label} time={item.time} />
              ))}
            </ol>
          </div>
        </div>
      </aside>

      {/* ── Mobile Visitor Details Slide-over Modal ── */}
      {showMobileDetails && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-card border-l border-border/40 h-full flex flex-col p-5 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brand" />
                <h3 className="font-bold text-[15px] text-foreground">Visitor Details</h3>
              </div>
              <button
                onClick={() => setShowMobileDetails(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-foreground/70 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1">Active Page</span>
                  <span className="text-brand font-semibold break-all block leading-tight">
                    {(() => {
                      if (!visitorPage) return "Unknown";
                      try {
                        const url = new URL(visitorPage);
                        return url.pathname + url.search + url.hash || "/";
                      } catch (e) {
                        return visitorPage;
                      }
                    })()}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1">Mode</span>
                    <StatusBadge status={currentConvo.status} />
                  </div>
                </div>
                {currentConvo.handoffReason && (
                  <div className="col-span-2 mt-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/35 block mb-1.5">Handoff Reason</span>
                    <div className="bg-card/60 border border-border/50 rounded-xl p-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="text-foreground/75 font-medium leading-relaxed block text-[12.5px] italic">"{currentConvo.handoffReason}"</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-border/40">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground/40">Activity Timeline</h4>
                <ol className="space-y-3 text-[12.5px]">
                  <TimelineItem icon={Circle} label="Visitor started conversation" time={currentConvo.createdAt ? new Date(currentConvo.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown"} />
                  {systemTimeline.map((item, i) => (
                    <TimelineItem key={i} icon={item.icon} label={item.label} time={item.time} />
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
