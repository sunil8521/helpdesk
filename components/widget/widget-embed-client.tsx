"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Send, BotMessageSquare, X, MessageSquare, HelpCircle, User, Paperclip } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { handleWidgetMessage, getChatHistory } from "@/app/actions/chat";

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

export function WidgetEmbedClient({ workspaceId, config, agent, ssoEmail, ssoName }: WidgetEmbedClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat");
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "ai" | "user" | "system"; text: string }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session ID and Load History
  useEffect(() => {
    let storedSession = localStorage.getItem("chat_session_id");
    if (!storedSession) {
      storedSession = uuidv4();
      localStorage.setItem("chat_session_id", storedSession);
    }
    setSessionId(storedSession);

    const loadHistory = async () => {
      const result = await getChatHistory(storedSession as string);
      if (result.success && result.messages.length > 0) {
        setMessages(result.messages.map((m: any) => ({
          sender: m.senderType === "visitor" ? "user" : m.senderType,
          text: m.content
        })));
      } else {
        // Initial Greeting if no history
        setMessages(config?.greeting ? [{ sender: "ai", text: config.greeting }] : [{ sender: "ai", text: "Hi 👋 How can we help today?" }]);
      }
    };
    loadHistory();
  }, [config?.greeting]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Notify parent window when open state changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        {
          type: "WIDGET_RESIZE",
          payload: {
            isExpanded: isOpen,
            position: config?.position,
          },
        },
        "*"
      );
    }
  }, [isOpen, config?.position]);

  

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || isLoading || !sessionId) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    setIsLoading(true);

    // Optimistically update UI
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    // Trigger AI Server Action
    const result = await handleWidgetMessage({
      sessionId,
      workspaceId,
      userMessage: userText,
      ssoEmail,
      ssoName
    });

    if (result.success && result.aiMessage) {
      setMessages((prev) => [...prev, { sender: "ai", text: result.aiMessage.content }]);
    } else if (result.success && !result.aiMessage) {
      // Handoff logic or system message
      if (result.status === "waiting" || result.status === "human") {
        setMessages((prev) => [...prev, { sender: "system", text: "An agent has been notified and will assist you shortly." }]);
      }
    } else {
      setMessages((prev) => [...prev, { sender: "system", text: "Failed to send message. Please try again." }]);
    }
    
    setIsLoading(false);
  };

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

  return (
    <div className="w-full h-full flex flex-col justify-end select-none font-sans overflow-hidden bg-transparent">
      {isOpen ? (
        /* Full Expanded Chat Window */
        <div className="w-full h-full bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-4.5 py-3.5 flex items-center justify-between text-white" style={{ background: themeColor }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-full overflow-hidden">
                <Image priority src={avatarUrl!} alt={agentName} width={50} height={50} className="h-full w-full object-contain p-0.5" unoptimized />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold leading-tight tracking-tight truncate">{agentName || title}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">AI</span>
                </div>
                <div className="text-[11.5px] font-medium opacity-80 truncate">{agentRole}</div>
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

          {/* Main Body content depending on active tab */}
          {activeTab === "chat" ? (
            <>
              {/* Messages Body */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto scrollbar-none bg-background">
                {messages.map((m, idx) => {
                  if (m.sender === "system") {
                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <div className="bg-red-50/80 text-red-600 border border-red-100 rounded-lg px-3 py-1.5 text-[10.5px] font-medium text-center">
                          {m.text}
                        </div>
                      </div>
                    );
                  }
                  
                  return m.sender === "ai" ? (
                    <div key={idx} className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] p-3 text-[12.5px] text-foreground leading-relaxed shadow-2xs">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex justify-end">
                      <div
                        className="max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2.5 text-[12.5px] text-white leading-relaxed shadow-xs"
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
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border/20 flex items-center gap-2.5 bg-background">
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
                  className="h-11 w-11 rounded-2xl grid place-items-center text-white shadow-sm shrink-0 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-200"
                  style={{ background: buttonColor }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-none bg-background p-4 flex flex-col">
              <h3 className="font-semibold text-[13px] text-foreground mb-3 shrink-0">Frequently Asked Questions</h3>
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
              className={`flex-1 flex flex-col items-center gap-0.5 ${activeTab === "chat" ? "font-bold text-foreground" : "hover:text-foreground"}`}
            >
              <MessageSquare className="h-3.5 w-3.5" style={activeTab === "chat" ? { color: themeColor } : {}} /> Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`flex-1 flex flex-col items-center gap-0.5 ${activeTab === "faq" ? "font-bold text-foreground" : "hover:text-foreground"}`}
            >
              <HelpCircle className="h-3.5 w-3.5" style={activeTab === "faq" ? { color: themeColor } : {}} /> FAQ
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
            <Image src={avatarUrl!} alt={agentName} width={56} height={56} className="h-full w-full object-contain filter drop-shadow-md" unoptimized />
          </button>
        </div>
      )}
    </div>
  );
}
