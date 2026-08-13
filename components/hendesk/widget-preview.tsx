"use client";

import { useState } from "react";
import { Send, BotMessageSquare, X, MessageSquare, HelpCircle, User, Paperclip, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  agentName?: string;
  agentRole?: string;
  avatarUrl?: string;
  greeting?: string;
  themeColor?: string;
  buttonColor?: string;
  position?: "bottom-right" | "bottom-left" | "right" | "left";
  className?: string;
  compact?: boolean;
  quickPrompts?: string[];
  initialFaqs?: any[];
}

export function WidgetPreview({
  title = "Acme Support",
  agentName = "Maya",
  agentRole = "E-commerce Shopping Assistant",
  avatarUrl,
  greeting = "Hello! I'm Maya, your friendly AI Agent. How can I help you today?",
  themeColor = "#4f46e5",
  buttonColor = "#4f46e5",
  position = "bottom-right",
  className,
  compact,
  initialFaqs = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <div className={cn(
      "w-full sm:w-[370px] h-[600px] max-h-[75vh] flex flex-col rounded-3xl bg-card border border-border/50 overflow-hidden select-none",
      "shadow-[0_28px_80px_-16px_rgba(0,0,0,0.2)] transition-all duration-300",
      compact && "w-[310px]",
      className
    )}>
      {/* Header with Avatar & Agent Details */}
      <div className="px-4.5 py-4 flex items-center justify-between text-white" style={{ background: themeColor }}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 grid place-items-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={agentName} className="h-full w-full object-contain" />
            ) : (
              <BotMessageSquare className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold leading-tight tracking-tight">{agentName || title}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">AI</span>
            </div>
            <div className="text-[11.5px] font-medium opacity-80 truncate max-w-[190px]">{agentRole}</div>
          </div>
        </div>
        <button className="h-7 w-7 rounded-lg bg-white/10 grid place-items-center opacity-80 hover:opacity-100 transition-opacity">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-auto scrollbar-none bg-background flex flex-col justify-start">
        {/* Dynamic Body based on tab */}
        {activeTab === "chat" ? (
          <div className="p-4.5 space-y-3.5">
            {/* AI Greeting */}
            <div className="space-y-2">
              <div className="rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] p-3 text-[12px] text-foreground leading-relaxed">
                {greeting}
              </div>

              {/* Quick Action Pill Buttons */}
             
            </div>
          
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-none p-4 mt-2 flex flex-col space-y-3 min-h-[220px]">
            {initialFaqs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground/50 py-6">
                <HelpCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-[12px]">No FAQs available yet.</p>
              </div>
            ) : (
              initialFaqs.map((faq) => (
                <div key={faq._id || faq.question} className="bg-muted/30 rounded-2xl border border-border/50 text-left overflow-hidden transition-all duration-200">
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
                    className={`px-3.5 pb-3.5 text-[12px] text-foreground/70 leading-relaxed transition-all duration-300 origin-top ${
                      openFaqId === faq._id ? "block animate-in fade-in slide-in-from-top-2" : "hidden"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-border/20 flex items-center gap-2.5 bg-background">
        <div className="flex-1 h-11 px-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2 focus-within:bg-white focus-within:border-slate-300 focus-within:shadow-sm transition-all duration-200">
          <input
            className="w-full h-full text-[13.5px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            placeholder="Type your message..."
          />
        </div>
        <button
          className="h-11 w-11 rounded-2xl grid place-items-center text-white shadow-sm shrink-0 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-200"
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
      </div>

      {/* Footer Navigation Tabs */}
      <div className="flex text-[11px] font-medium border-t border-border/30 bg-[oklch(0.99_0.002_260)] text-foreground/45 py-2">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex flex-col items-center gap-0.5 transition-colors ${activeTab === "chat" ? "font-bold text-foreground" : "hover:text-foreground"}`}
        >
          <MessageSquare className="h-3.5 w-3.5" style={activeTab === "chat" ? { color: themeColor } : {}} /> Chat
        </button>
        <button 
          onClick={() => setActiveTab("faq")}
          className={`flex-1 flex flex-col items-center gap-0.5 transition-colors ${activeTab === "faq" ? "font-bold text-foreground" : "hover:text-foreground"}`}
        >
          <HelpCircle className="h-3.5 w-3.5" style={activeTab === "faq" ? { color: themeColor } : {}} /> FAQ
        </button>
      </div>

      <div className="text-center text-[9px] font-medium text-foreground/25 py-1.5 border-t border-border/20 bg-background">
        Powered by Helpdesk AI
      </div>
      <div className="sr-only">{position}</div>
    </div>
  );
}
