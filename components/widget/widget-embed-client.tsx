"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, MessageSquare, HelpCircle, Paperclip, RefreshCw, ArrowRight, Bot, Headphones, Info, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  getChatHistory,
  sendMessageToAi,
  getVisitorSocketTicket,
  continueChat,
  startNewChat,
} from "@/app/actions/chat";
import { io, Socket } from "socket.io-client";
import { LeadCaptureForm } from "./lead-capture-form";
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
    leadCapture?: {
      enabled: boolean;
      requiredFields: string[];
    };
  } | null;
  agent: {
    name?: string;
    role?: string;
  } | null;
  initialFaqs?: any[];
  previewMode?: boolean;
}

interface ChatMessage {
  _id: string;
  sender: "ai" | "user" | "system" | "agent";
  text: string;
  sequence: number;
  pending?: boolean;
  clientMessageId?: string;
  failed?: boolean;
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
  initialFaqs = [],
  previewMode = false,
}: WidgetEmbedClientProps) {
  const [isOpen, setIsOpen] = useState(previewMode);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState(config?.greeting || "Hi 👋 How can we help today?");
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeStatus, setRouteStatus] = useState<
    "ai" | "waiting" | "human" | "resolved"
  >("ai");
  const [socketConnected, setSocketConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasCapturedLead, setHasCapturedLead] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<TypedSocket | null>(null);
  const routeStatusRef = useRef(routeStatus);

  useEffect(() => {
    routeStatusRef.current = routeStatus;
  }, [routeStatus]);

  useEffect(() => {
    if (isOpen) {
      setShowPopup(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setPopupMsg(config?.greeting || "Hi 👋 How can we help today?");
  }, [config?.greeting]);

  // Proactive popup interval logic
  useEffect(() => {
    if (previewMode) {
      setShowPopup(true);
      return;
    }

    if (config?.proactiveMessage === false) {
      return;
    }

    const messages = [
      config?.greeting || "Hi 👋 How can we help today?",
    ];

    let isMounted = true;

    const initialTimer = setTimeout(() => {
      if (isMounted && !isOpen && routeStatusRef.current === "ai") {
        setPopupMsg(messages[0]);
        setShowPopup(true);
        setTimeout(() => isMounted && setShowPopup(false), 7000);
      }
    }, 3000);

    const intervalTimer = setInterval(() => {
      if (isMounted && !isOpen && routeStatusRef.current === "ai") {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setPopupMsg(randomMsg);
        setShowPopup(true);
        setTimeout(() => isMounted && setShowPopup(false), 7000);
      }
    }, 25000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isOpen, previewMode, config?.greeting, config?.proactiveMessage]);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocketConnected(false);
  }, []);

  const connectSocket = useCallback(
    async (sid: string) => {
      if (socketRef.current?.connected) return;

      try {
        const ticketResult = await getVisitorSocketTicket(sid, workspaceId);
        if (!ticketResult.ticket || !ticketResult.conversationId) {
          console.error("[Widget] Failed to get socket ticket:", ticketResult.error);
          return;
        }

        setConversationId(ticketResult.conversationId);

        const socket: TypedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
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

        socket.on("message:created", (msg: SocketMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
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

        socket.on("conversation:route-changed", (change) => {
          routeStatusRef.current = change.status;
          setRouteStatus(change.status);

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

  useEffect(() => {
    let cancelled = false;
    const storageKey = `chat_session_id:${workspaceId}`;
    const leadKey = `helpdesk_lead_${workspaceId}`;
    let storedSession =
      localStorage.getItem(storageKey) ||
      localStorage.getItem("chat_session_id");

    if (!storedSession) {
      storedSession = uuidv4();
    }
    localStorage.setItem(storageKey, storedSession);
    setHasCapturedLead(localStorage.getItem(leadKey) === "1");

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
        const greetingMsg = {
          _id: "greeting",
          sender: "ai" as const,
          text: config?.greeting!,
          sequence: -1,
        };

        setMessages([
          greetingMsg,
          ...result.messages.map((m: any) => ({
            _id: m._id || uuidv4(),
            sender: m.senderType === "visitor" ? "user" : m.senderType,
            text: m.content,
            sequence: m.sequence || 0,
            clientMessageId: m.clientMessageId,
          }))
        ]);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        {
          type: "WIDGET_RESIZE",
          payload: { isExpanded: isOpen, showPopup: showPopup, position: config?.position },
        },
        "*"
      );
    }
  }, [isOpen, showPopup, config?.position]);

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!inputMsg.trim() || isLoading || !sessionId) return;

      const userText = inputMsg.trim();
      const clientMessageId = uuidv4();
      setInputMsg("");

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
                ? { ...m, pending: false, failed: true }
                : m
            )
          );
          return;
        }

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

        if (result.conversationId) setConversationId(result.conversationId);

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

          setIsLoading(true);
          await connectSocket(sessionId);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }

        return;
      }

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
                    failed: true,
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

  const handleContinueChat = useCallback(async () => {
    if (!conversationId) return;
    const result = await continueChat(conversationId);
    if (result.ok) {
      routeStatusRef.current = "ai";
      setRouteStatus("ai");
      disconnectSocket();
    }
  }, [conversationId, disconnectSocket]);

  const handleNewChat = useCallback(async () => {
    if (!sessionId) return;
    await startNewChat(sessionId, workspaceId);

    const newSession = uuidv4();
    const storageKey = `chat_session_id:${workspaceId}`;
    localStorage.setItem(storageKey, newSession);
    setSessionId(newSession);
    setConversationId(null);

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

          {config?.leadCapture?.enabled && !hasCapturedLead ? (
            <LeadCaptureForm
              workspaceId={workspaceId}
              visitorId={sessionId || "temp"}
              requiredFields={config.leadCapture.requiredFields}
              themeColor={themeColor}
              buttonColor={buttonColor}
              onCaptured={() => setHasCapturedLead(true)}
            />
          ) : activeTab === "chat" ? (
            <>
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
                    <div key={m._id} className="flex flex-col items-end">
                      <div
                        className={`max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2.5 text-[12.5px] text-white leading-relaxed shadow-xs ${m.pending ? "opacity-60" : ""
                          }`}
                        style={{ background: buttonColor }}
                      >
                        {m.text}
                      </div>
                      {m.failed && (
                        <span className="text-[10.5px] font-medium text-red-500 mt-1 mr-1">
                          Failed to send
                        </span>
                      )}
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
            <div className="flex-1 overflow-y-auto scrollbar-none bg-background p-4 flex flex-col space-y-3">
              {initialFaqs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground/50 pb-10">
                  <HelpCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-[12px]">No FAQs available yet.</p>
                </div>
              ) : (
                initialFaqs.map((faq) => (
                  <div key={faq._id} className="bg-muted/30 rounded-2xl border border-border/50 text-left overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(openFaqId === faq._id ? null : faq._id)}
                      className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none"
                    >
                      <h4 className="text-[13px] font-bold text-foreground pr-4">{faq.question}</h4>
                      <ChevronDown
                        className={`h-4 w-4 text-foreground/50 transition-transform duration-200 shrink-0 ${openFaqId === faq._id ? "rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      className={`px-3.5 pb-3.5 text-[12px] text-foreground/70 leading-relaxed transition-all duration-300 origin-top ${openFaqId === faq._id ? "block animate-in fade-in slide-in-from-top-2" : "hidden"
                        }`}
                    >
                      {faq.answer}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Tabs & Branding */}
          <div className="flex text-[11px] font-medium border-t border-border/30 bg-[oklch(0.99_0.002_260)] text-foreground/45 py-2">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex flex-col items-center gap-0.5 ${activeTab === "chat"
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
              className={`flex-1 flex flex-col items-center gap-0.5 ${activeTab === "faq"
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
        /* Floating Launcher */
        <div className={`w-full h-full relative flex flex-col ${config?.position === "left" ? "items-start" : "items-end"} justify-end bg-transparent p-1`}>
          {showPopup && !isOpen && (
            <div
              className={`absolute bottom-[86px] ${config?.position === "left" ? "left-2 origin-bottom-left" : "right-2 origin-bottom-right"} max-w-[220px] bg-white dark:bg-slate-800 rounded-[20px] px-4 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-border/40 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => setIsOpen(true)}
            >
              {/* Tooltip Tail */}
              <svg
                className={`absolute -bottom-[8px] ${config?.position === "left" ? "left-[22px]" : "right-[22px]"} w-5 h-[9px] text-white dark:text-slate-800 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.05)]`}
                viewBox="0 0 20 9"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0C4.305 0 7.822 2.65 9.405 6.6L10 8L10.595 6.6C12.178 2.65 15.695 0 20 0H0Z" />
              </svg>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
                className="absolute top-2 right-2 text-foreground/30 hover:text-foreground/80 hover:bg-muted p-1 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-3 w-3" />
              </button>

              <p className="text-[13px] text-slate-700 dark:text-slate-200 font-semibold pr-4 leading-snug">
                {popupMsg}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="h-[72px] w-[72px] grid place-items-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border-none outline-none bg-transparent"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={agentName}
                width={72}
                height={72}
                className="h-full w-full object-contain filter drop-shadow-md"
                unoptimized
              />
            ) : (
              <div
                className="h-[72px] w-[72px] rounded-full grid place-items-center text-white shadow-lg"
                style={{ background: buttonColor }}
              >
                <MessageSquare className="h-7 w-7 text-white drop-shadow-md" />
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
