"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, MessageSquare, HelpCircle, Paperclip, RefreshCw, ArrowRight, UserCheck, Bot, Headphones, Info } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  getChatHistory,
  sendMessageToAi,
  getVisitorSocketTicket,
  continueChat,
  startNewChat,
} from "@/app/actions/chat";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketMessage,
} from "@/lib/chat/socket-events";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface WidgetEmbedClientProps {
  workspaceId: string;
  ssoEmail?: string;
  ssoName?: string;
  config: {
    title?: string;
    greeting?: string;
    avatarUrl?: string;
    themeColor?: string;
    buttonColor?: string;
    position?: "right" | "left";
    proactiveMessage?: boolean;
  } | null;
  agent: {
    name?: string;
    role?: string;
  } | null;
}

interface ChatMessage {
  _id: string;
  sender: "ai" | "user" | "system" | "agent";
  text: string;
  sequence: number;
  pending?: boolean;
  clientMessageId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WidgetEmbedClient({
  workspaceId,
  config,
  agent,
  ssoEmail,
  ssoName,
}: WidgetEmbedClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat");
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeStatus, setRouteStatus] = useState<
    "ai" | "waiting" | "human" | "resolved"
  >("ai");
  const [socketConnected, setSocketConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<TypedSocket | null>(null);
  const routeStatusRef = useRef(routeStatus);

  useEffect(() => {
    routeStatusRef.current = routeStatus;
  }, [routeStatus]);

  // ---------------------------------------------------------------------------
  // Socket helpers — only used for human/waiting mode
  // ---------------------------------------------------------------------------
  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocketConnected(false);
  }, []);

  const connectSocket = useCallback(
    async (sid: string) => {
      // Already connected
      if (socketRef.current?.connected) return;

      try {
        const ticketResult = await getVisitorSocketTicket(sid, workspaceId);
        if (!ticketResult.ticket || !ticketResult.conversationId) {
          console.error("[Widget] Failed to get socket ticket:", ticketResult.error);
          return;
        }

        setConversationId(ticketResult.conversationId);

        const socket: TypedSocket = io({
          auth: { token: ticketResult.ticket, clientType: "visitor" },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("[Widget Socket] Connected");
          setSocketConnected(true);
        });

        socket.on("disconnect", () => {
          console.log("[Widget Socket] Disconnected");
          setSocketConnected(false);
        });

        socket.on("connect_error", (err) => {
          console.error("[Widget Socket] Error:", err.message);
          setSocketConnected(false);
        });

        // New message from agent/system
        socket.on("message:created", (msg: SocketMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            // Replace optimistic message
            if (
              msg.clientMessageId &&
              prev.some((m) => m.clientMessageId === msg.clientMessageId)
            ) {
              return prev
                .map((m) =>
                  m.clientMessageId === msg.clientMessageId
                    ? {
                        _id: msg._id,
                        sender:
                          msg.senderType === "visitor"
                            ? ("user" as const)
                            : msg.senderType,
                        text: msg.content,
                        sequence: msg.sequence,
                        clientMessageId: msg.clientMessageId,
                      }
                    : m
                )
                .sort((a, b) => a.sequence - b.sequence);
            }
            // Skip own visitor messages (already shown optimistically)
            if (msg.senderType === "visitor") return prev;
            return [
              ...prev,
              {
                _id: msg._id,
                sender: msg.senderType,
                text: msg.content,
                sequence: msg.sequence,
              },
            ].sort((a, b) => a.sequence - b.sequence);
          });
          setIsLoading(false);
        });

        // Route changed (agent claimed, resolved, returned to AI)
        socket.on("conversation:route-changed", (change) => {
          routeStatusRef.current = change.status;
          setRouteStatus(change.status);

          // Show system message
          setMessages((prev) => {
            if (prev.some((m) => m._id === change.systemMessage._id))
              return prev;
            return [
              ...prev,
              {
                _id: change.systemMessage._id,
                sender: "system" as const,
                text: change.systemMessage.content,
                sequence: change.systemMessage.sequence,
              },
            ].sort((a, b) => a.sequence - b.sequence);
          });
          setIsLoading(false);

          // If returned to AI, disconnect socket
          if (change.status === "ai") {
            disconnectSocket();
          }
        });

        socketRef.current = socket;
      } catch (err) {
        console.error("[Widget] Failed to connect socket:", err);
      }
    },
    [workspaceId, disconnectSocket]
  );

  // ---------------------------------------------------------------------------
  // Initialize: load session + history
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const storageKey = `chat_session_id:${workspaceId}`;
    let storedSession =
      localStorage.getItem(storageKey) ||
      localStorage.getItem("chat_session_id");

    if (!storedSession) {
      storedSession = uuidv4();
    }
    localStorage.setItem(storageKey, storedSession);

    const init = async () => {
      if (cancelled) return;
      setSessionId(storedSession);

      const result = await getChatHistory(storedSession as string, workspaceId);
      if (cancelled) return;

      if (result.status) {
        routeStatusRef.current = result.status;
        setRouteStatus(result.status);
      }
      if (result.conversationId) setConversationId(result.conversationId);

      if (result.success && result.messages && result.messages.length > 0) {
        setMessages(
          result.messages.map((m: any) => ({
            _id: m._id || uuidv4(),
            sender: m.senderType === "visitor" ? "user" : m.senderType,
            text: m.content,
            sequence: m.sequence || 0,
            clientMessageId: m.clientMessageId,
          }))
        );
      } else {
        setMessages([
          {
            _id: "greeting",
            sender: "ai",
            text: config?.greeting || "Hi 👋 How can we help today?",
            sequence: 0,
          },
        ]);
      }

      // If conversation is in waiting/human mode, connect socket
      if (result.status === "waiting" || result.status === "human") {
        await connectSocket(storedSession as string);
      }
    };

    init();

    return () => {
      cancelled = true;
      disconnectSocket();
    };
  }, [workspaceId, config?.greeting, connectSocket, disconnectSocket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Notify parent window when open state changes (for iframe resize)
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        {
          type: "WIDGET_RESIZE",
          payload: { isExpanded: isOpen, position: config?.position },
        },
        "*"
      );
    }
  }, [isOpen, config?.position]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!inputMsg.trim() || isLoading || !sessionId) return;

      const userText = inputMsg.trim();
      const clientMessageId = uuidv4();
      setInputMsg("");

      // Optimistic user message
      setMessages((prev) => [
        ...prev,
        {
          _id: `pending-${clientMessageId}`,
          sender: "user",
          text: userText,
          sequence: prev.length + 1,
          pending: true,
          clientMessageId,
        },
      ]);

      // ------- AI MODE: server action, no socket -------
      if (routeStatusRef.current === "ai") {
        setIsLoading(true);

        const result = await sendMessageToAi({
          sessionId,
          workspaceId,
          content: userText,
          clientMessageId,
          visitor: {
            name: ssoName,
            email: ssoEmail,
            currentPage: document.referrer || window.location.href,
          },
        });

        if (!result.ok) {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMessageId === clientMessageId
                ? { ...m, pending: false, text: `${m.text} (failed to send)` }
                : m
            )
          );
          return;
        }

        // Replace optimistic message with confirmed
        if (result.visitorMessage) {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMessageId === clientMessageId
                ? {
                    _id: result.visitorMessage!._id,
                    sender: "user",
                    text: result.visitorMessage!.content,
                    sequence: result.visitorMessage!.sequence,
                    clientMessageId,
                  }
                : m
            )
          );
        }

        // Set conversation ID
        if (result.conversationId) setConversationId(result.conversationId);

        // Add AI response
        if (result.aiMessage) {
          setMessages((prev) => [
            ...prev,
            {
              _id: result.aiMessage!._id,
              sender: "ai",
              text: result.aiMessage!.content,
              sequence: result.aiMessage!.sequence,
            },
          ]);
        }

        // If escalated: show system messages, connect socket
        if (result.escalated) {
          if (result.systemMessages) {
            setMessages((prev) => [
              ...prev,
              ...result.systemMessages!.map((s: any) => ({
                _id: s._id,
                sender: "system" as const,
                text: s.content,
                sequence: s.sequence,
              })),
            ]);
          }

          const newStatus = (result.newStatus as typeof routeStatus) || "waiting";
          routeStatusRef.current = newStatus;
          setRouteStatus(newStatus);

          // Connect socket for real-time
          setIsLoading(true); // Show "connecting" dots
          await connectSocket(sessionId);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }

        return;
      }

      // ------- HUMAN/WAITING MODE: send via socket -------
      const socket = socketRef.current;
      if (!socket?.connected) {
        setMessages((prev) => [
          ...prev,
          {
            _id: uuidv4(),
            sender: "system",
            text: "Connection lost. Please try again.",
            sequence: prev.length + 2,
          },
        ]);
        return;
      }

      socket.emit(
        "message:send",
        { clientMessageId, content: userText },
        (res) => {
          if (!res.ok) {
            console.error("[Widget] Failed to send:", res.error);
            setMessages((prev) =>
              prev.map((m) =>
                m.clientMessageId === clientMessageId
                  ? {
                      ...m,
                      pending: false,
                      text: `${m.text} (failed to send)`,
                    }
                  : m
              )
            );
          }
        }
      );
    },
    [inputMsg, isLoading, sessionId, workspaceId, ssoName, ssoEmail, connectSocket]
  );

  // ---------------------------------------------------------------------------
  // Continue Chat (reopen resolved → AI mode)
  // ---------------------------------------------------------------------------
  const handleContinueChat = useCallback(async () => {
    if (!conversationId) return;
    const result = await continueChat(conversationId);
    if (result.ok) {
      routeStatusRef.current = "ai";
      setRouteStatus("ai");
      disconnectSocket();
    }
  }, [conversationId, disconnectSocket]);

  // ---------------------------------------------------------------------------
  // New Chat (delete everything, fresh start)
  // ---------------------------------------------------------------------------
  const handleNewChat = useCallback(async () => {
    if (!sessionId) return;
    await startNewChat(sessionId, workspaceId);

    // Generate new session
    const newSession = uuidv4();
    const storageKey = `chat_session_id:${workspaceId}`;
    localStorage.setItem(storageKey, newSession);
    setSessionId(newSession);
    setConversationId(null);

    // Reset state
    routeStatusRef.current = "ai";
    setRouteStatus("ai");
    disconnectSocket();
    setMessages([
      {
        _id: "greeting",
        sender: "ai",
        text: config?.greeting || "Hi 👋 How can we help today?",
        sequence: 0,
      },
    ]);
    setInputMsg("");
    setIsLoading(false);
  }, [sessionId, workspaceId, config?.greeting, disconnectSocket]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!workspaceId) {
    return (
      <div className="w-full h-full flex items-end justify-end p-2 font-sans">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-3 text-xs font-semibold">
          Invalid Widget Workspace ID
        </div>
      </div>
    );
  }

  const themeColor = config?.themeColor || "#4f46e5";
  const buttonColor = config?.buttonColor || "#4f46e5";
  const title = config?.title || "Support Chat";
  const agentName = agent?.name || "Maya";
  const agentRole = agent?.role || "Customer Support Specialist";
  const avatarUrl = config?.avatarUrl;

  const routeLabel =
    routeStatus === "ai"
      ? "AI"
      : routeStatus === "waiting"
      ? "Connecting…"
      : routeStatus === "human"
      ? "Human"
      : "Resolved";

  return (
    <div className="w-full h-full flex flex-col justify-end select-none font-sans overflow-hidden bg-transparent">
      {isOpen ? (
        <div className="w-full h-full bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div
            className="px-4.5 py-3.5 flex items-center justify-between text-white"
            style={{ background: themeColor }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-full overflow-hidden">
                {avatarUrl && (
                  <Image
                    priority
                    src={avatarUrl}
                    alt="profile_picture"
                    width={50}
                    height={50}
                    className="h-full w-full object-contain p-0.5"
                    unoptimized
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold leading-tight tracking-tight truncate">
                    {agentName || title}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                    {routeLabel}
                  </span>
                  {(routeStatus === "waiting" ||
                    routeStatus === "human") && (
                    <span
                      title={
                        socketConnected
                          ? "Realtime connected"
                          : "Realtime reconnecting"
                      }
                      className={`h-1.5 w-1.5 rounded-full ${socketConnected ? "bg-emerald-200" : "bg-white/40"}`}
                    />
                  )}
                </div>
                <div className="text-[11.5px] font-medium opacity-80 truncate">
                  {agentRole}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-white/10 grid place-items-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Body */}
          {activeTab === "chat" ? (
            <>
              {/* Messages */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto scrollbar-none bg-background">
                {messages.map((m) => {
                  if (m.sender === "system") {
                    return (
                      <div key={m._id} className="flex justify-center my-3.5">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
                          <Info className="h-3 w-3 text-brand shrink-0" />
                          <span>{m.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return m.sender === "ai" ? (
                    <div key={m._id} className="flex justify-start">
                      <div className="max-w-[85%] space-y-1">
                        <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800/80 p-3 text-[12.5px] text-foreground leading-relaxed shadow-2xs">
                          {m.text}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/45 pl-1">
                          <Bot className="h-3.5 w-3.5 text-foreground/50" />
                          <span>AI Assistant</span>
                        </div>
                      </div>
                    </div>
                  ) : m.sender === "agent" ? (
                    <div key={m._id} className="flex justify-start">
                      <div className="max-w-[85%] space-y-1">
                        <div className="rounded-2xl rounded-tl-xs bg-emerald-500/10 border border-emerald-500/20 p-3 text-[12.5px] text-foreground leading-relaxed shadow-2xs">
                          {m.text}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pl-1">
                          <Headphones className="h-3.5 w-3.5" />
                          <span>Support Agent</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={m._id} className="flex justify-end">
                      <div
                        className={`max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2.5 text-[12.5px] text-white leading-relaxed shadow-xs ${
                          m.pending ? "opacity-60" : ""
                        }`}
                        style={{ background: buttonColor }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex w-full mb-4 justify-start">
                    <div className="px-3 py-2 rounded-2xl bg-slate-100 text-slate-800 text-[14px] shadow-sm flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Resolved state: Continue / New Chat buttons */}
              {routeStatus === "resolved" ? (
                <div className="p-3 border-t border-border/20 bg-background space-y-2">
                  <p className="text-center text-[11px] text-foreground/50 font-medium">
                    This conversation has been resolved.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleContinueChat}
                      className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold border border-border/60 text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5" /> Continue Chat
                    </button>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{ background: buttonColor }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> New Chat
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-border/20 flex items-center gap-2.5 bg-background"
                >
                  <div className="flex-1 h-11 px-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2 focus-within:bg-white focus-within:border-slate-300 focus-within:shadow-sm transition-all duration-200">
                    <Paperclip className="h-4 w-4 text-slate-400 shrink-0 cursor-pointer hover:text-slate-600 transition-colors" />
                    <input
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="w-full h-full text-[13.5px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      placeholder="Type your message..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !inputMsg.trim()}
                    className="h-11 w-11 rounded-2xl grid place-items-center text-white shadow-sm shrink-0 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-200 disabled:opacity-50"
                    style={{ background: buttonColor }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 ml-0.5"
                    >
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-none bg-background p-4 flex flex-col">
              <h3 className="font-semibold text-[13px] text-foreground mb-3 shrink-0">
                Frequently Asked Questions
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground/50 pb-10">
                <HelpCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-[12px]">No FAQs available yet.</p>
              </div>
            </div>
          )}

          {/* Footer Tabs & Branding */}
          <div className="flex text-[11px] font-medium border-t border-border/30 bg-[oklch(0.99_0.002_260)] text-foreground/45 py-2">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex flex-col items-center gap-0.5 ${
                activeTab === "chat"
                  ? "font-bold text-foreground"
                  : "hover:text-foreground"
              }`}
            >
              <MessageSquare
                className="h-3.5 w-3.5"
                style={activeTab === "chat" ? { color: themeColor } : {}}
              />{" "}
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`flex-1 flex flex-col items-center gap-0.5 ${
                activeTab === "faq"
                  ? "font-bold text-foreground"
                  : "hover:text-foreground"
              }`}
            >
              <HelpCircle
                className="h-3.5 w-3.5"
                style={activeTab === "faq" ? { color: themeColor } : {}}
              />{" "}
              FAQ
            </button>
          </div>

          <div className="text-center text-[9px] font-medium text-foreground/25 py-1.5 border-t border-border/20 bg-background">
            Powered by Helpdesk AI
          </div>
        </div>
      ) : (
        /* Floating Launcher Bubble Button */
        <div className="w-full h-full grid place-items-center bg-transparent">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 grid place-items-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0 border-none outline-none bg-transparent"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={agentName}
                width={56}
                height={56}
                className="h-full w-full object-contain filter drop-shadow-md"
                unoptimized
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full grid place-items-center text-white shadow-lg"
                style={{ background: buttonColor }}
              >
                <MessageSquare className="h-6 w-6" />
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
