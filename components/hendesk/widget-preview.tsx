"use client";

import { Send, BotMessageSquare, X, MessageSquare, HelpCircle, User, Paperclip } from "lucide-react";
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
  quickPrompts = ["Browse products", "Track an order"],
}: Props) {
  return (
    <div className={cn(
      "w-[370px] rounded-3xl bg-card border border-border/50 overflow-hidden select-none",
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
      <div className="p-4.5 space-y-3.5 h-[270px] overflow-auto scrollbar-none bg-background flex flex-col justify-start">
        {/* AI Greeting */}
        <div className="space-y-2">
          <div className="rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] p-3 text-[12px] text-foreground leading-relaxed">
            {greeting}
          </div>
          
          {/* Quick Action Pill Buttons */}
          {quickPrompts && quickPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-border/60 bg-background text-foreground/80 hover:border-brand hover:text-brand transition-colors shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulated sample conversation */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2.5 text-[12px] text-white leading-relaxed shadow-xs" style={{ background: buttonColor }}>
            What are your delivery times?
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] p-3 text-[12px] leading-relaxed text-foreground">
            Standard delivery takes 2-3 business days. Express shipping is available at checkout!
          </div>
          <div className="flex gap-1.5">
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-[oklch(0.975_0.003_260)] border border-border/30 text-foreground/40">Shipping Policy.pdf</span>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="p-2.5 border-t border-border/40 flex items-center gap-2 bg-background">
        <div className="flex-1 h-9 px-3 rounded-xl bg-[oklch(0.975_0.003_260)] border border-border/30 flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
          <input
            className="w-full text-[12px] bg-transparent outline-none text-foreground placeholder:text-foreground/25"
            placeholder="Type your message…"
            readOnly
          />
        </div>
        <button className="h-9 w-9 rounded-xl grid place-items-center text-white shadow-xs shrink-0" style={{ background: buttonColor }}>
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Footer Navigation Tabs */}
      <div className="flex text-[11px] font-medium border-t border-border/30 bg-[oklch(0.99_0.002_260)] text-foreground/45 py-2">
        <button className="flex-1 flex flex-col items-center gap-0.5 font-bold text-foreground">
          <MessageSquare className="h-3.5 w-3.5" style={{ color: themeColor }} /> Chat
        </button>
        <button className="flex-1 flex flex-col items-center gap-0.5 hover:text-foreground">
          <HelpCircle className="h-3.5 w-3.5" /> Docs
        </button>
        <button className="flex-1 flex flex-col items-center gap-0.5 hover:text-foreground">
          <User className="h-3.5 w-3.5" /> Agent
        </button>
      </div>

      <div className="text-center text-[9px] font-medium text-foreground/25 py-1.5 border-t border-border/20 bg-background">
        Powered by Helpdesk AI
      </div>
      <div className="sr-only">{position}</div>
    </div>
  );
}
