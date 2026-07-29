"use client";

import { useState, useEffect } from "react";
import { BotMessageSquare, Send, MousePointerClick, User, RefreshCw, Zap, ArrowUpRight } from "lucide-react";

export function HeroAnimatedPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Animation timeline loop (ms)
    const timeline = [
      { step: 1, delay: 1000 },  // Mouse moves to launcher
      { step: 2, delay: 1800 },  // Mouse clicks launcher
      { step: 3, delay: 2300 },  // Widget expands
      { step: 4, delay: 3000 },  // Greeting appears
      { step: 5, delay: 4200 },  // User question 1
      { step: 6, delay: 5200 },  // AI typing indicator
      { step: 7, delay: 6600 },  // AI response + sources
      { step: 8, delay: 8400 },  // Escalation request
      { step: 9, delay: 9600 },  // Live agent joined
      { step: 10, delay: 14000 }, // Reset loop
    ];

    const timeouts: NodeJS.Timeout[] = [];

    const runSequence = () => {
      setStep(0);
      timeline.forEach(({ step: s, delay }) => {
        const t = setTimeout(() => {
          if (s === 10) {
            runSequence();
          } else {
            setStep(s);
          }
        }, delay);
        timeouts.push(t);
      });
    };

    runSequence();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const isOpen = step >= 3;
  const showGreeting = step >= 4;
  const showUserMsg1 = step >= 5;
  const showAiTyping = step === 6;
  const showAiMsg1 = step >= 7;
  const showUserMsg2 = step >= 8;
  const showHandoff = step >= 9;

  return (
    <div className="relative rounded-2xl border border-border/50 bg-card shadow-[0_32px_90px_-16px_rgba(0,0,0,0.12)] overflow-hidden select-none w-full max-w-[660px] h-[480px] flex flex-col">
      {/* ── Browser Chrome Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-[oklch(0.985_0.003_260)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 max-w-[280px] mx-auto h-6 rounded-lg bg-background border border-border/50 flex items-center justify-center gap-1.5 px-3">
          <span className="h-2 w-2 rounded-full bg-emerald shrink-0" />
          <span className="text-[11px] text-foreground/45 font-mono tracking-tight truncate">
            my-awesome-store.com
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-foreground/30 font-medium">
          <RefreshCw className="h-3 w-3" />
        </div>
      </div>

      {/* ── Simulated Website Content (Full Height Page) ── */}
      <div className="relative flex-1 bg-gradient-to-b from-background via-muted/10 to-background p-6 flex flex-col justify-between overflow-hidden">
        {/* Dummy Website Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-md bg-brand/10 text-brand grid place-items-center font-bold text-[10px]">S</div>
            <span className="font-semibold text-[12px] tracking-tight text-foreground/70">Storecraft</span>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-foreground/40 font-medium">
            <span>Products</span>
            <span>Solutions</span>
            <span>Docs</span>
            <span className="px-2.5 py-1 rounded-full bg-foreground/90 text-background font-semibold text-[9.5px]">Get Started</span>
          </div>
        </div>

        {/* Website Hero Section */}
        <div className="my-auto max-w-[340px]">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            <Zap className="h-3 w-3" /> E-Commerce v2.4
          </span>
          <h3 className="mt-3.5 text-[24px] font-bold tracking-tight leading-[1.15]">
            Build &amp; scale your online store in minutes.
          </h3>
          <p className="mt-2.5 text-[12.5px] text-foreground/45 leading-relaxed">
            Accept payments, manage inventory, and deliver instant AI customer support out of the box.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            <div className="h-8 px-4 rounded-full bg-brand text-white text-[11px] font-semibold flex items-center gap-1">
              Start Free Trial <ArrowUpRight className="h-3 w-3" />
            </div>
            <div className="h-8 px-4 rounded-full border border-border text-[11px] font-medium flex items-center text-foreground/60">
              View Specs
            </div>
          </div>
        </div>

        {/* Website Bottom Cards (Proof elements) */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/30 max-w-[350px]">
          {[
            { label: "Uptime", val: "99.9%" },
            { label: "Checkout", val: "Instant" },
            { label: "AI Support", val: "Built-in" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/40 p-2.5">
              <div className="text-[10px] text-foreground/40 font-medium">{item.label}</div>
              <div className="text-[13px] font-bold text-foreground mt-0.5">{item.val}</div>
            </div>
          ))}
        </div>

        {/* ── Mouse Pointer Click Icon ── */}
        <div
          className={`absolute z-50 pointer-events-none transition-all duration-1000 ease-out ${step === 0
              ? "top-14 left-14 opacity-0 scale-100"
              : step === 1
                ? "bottom-12 right-12 opacity-100 scale-100"
                : step === 2
                  ? "bottom-7 right-7 opacity-100 scale-90"
                  : "bottom-5 right-5 opacity-0 scale-75"
            }`}
        >
          <div className="relative">
            <MousePointerClick className="h-5 w-5 text-foreground drop-shadow-md" />
            {step === 2 && (
              <span className="absolute -top-1 -left-1 h-7 w-7 rounded-full border-2 border-brand bg-brand/20 animate-ping" />
            )}
          </div>
        </div>

        {/* ── Floating Chat Launcher Icon (Bottom Right) ── */}
        <div className="absolute bottom-5 right-5 z-20">
          <button
            onClick={() => setStep(step >= 3 ? 0 : 3)}
            className={`h-11 w-11 rounded-full bg-brand text-white shadow-lg shadow-brand/20 grid place-items-center transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
              }`}
          >
            <BotMessageSquare className="h-5 w-5" />
          </button>
        </div>

        {/* ── Compact Proportional Helpdesk Widget ── */}
        <div
          className={`absolute bottom-5 right-5 z-30 w-[270px] rounded-2xl bg-card border border-border/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] overflow-hidden transition-all duration-400 ease-out origin-bottom-right ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-6 pointer-events-none"
            }`}
        >
          {/* Header */}
          <div className="bg-brand px-3.5 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-white/20 backdrop-blur-sm grid place-items-center">
                <BotMessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[11.5px] font-bold leading-tight">Helpdesk AI</div>
                <div className="text-[9.5px] opacity-75 font-medium">Instant support</div>
              </div>
            </div>
            <button
              onClick={() => setStep(0)}
              className="text-white/70 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="p-3 space-y-2 h-[210px] overflow-y-auto scrollbar-none bg-background flex flex-col justify-start">
            {/* Greeting */}
            {showGreeting && (
              <div className="flex gap-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="h-5.5 w-5.5 rounded-full bg-brand text-white grid place-items-center shrink-0 mt-0.5 shadow-sm">
                  <BotMessageSquare className="h-3 w-3" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] px-3 py-2 text-[11px] leading-relaxed text-foreground">
                  Hi 👋 How can I help you with Storecraft today?
                </div>
              </div>
            )}

            {/* User message 1 */}
            {showUserMsg1 && (
              <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-brand text-white px-3 py-2 text-[11px] leading-relaxed shadow-sm">
                  Do you support WordPress &amp; WooCommerce?
                </div>
              </div>
            )}

            {/* AI typing */}
            {showAiTyping && (
              <div className="flex gap-1.5 items-center animate-in fade-in-0 duration-200">
                <div className="h-5.5 w-5.5 rounded-full bg-brand/10 text-brand grid place-items-center shrink-0">
                  <BotMessageSquare className="h-3 w-3 animate-pulse" />
                </div>
                <div className="rounded-2xl bg-[oklch(0.975_0.003_260)] px-2.5 py-1.5 text-[10.5px] text-foreground/40 font-medium">
                  Helpdesk AI searching docs…
                </div>
              </div>
            )}

            {/* AI response 1 */}
            {showAiMsg1 && (
              <div className="flex gap-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="h-5.5 w-5.5 rounded-full bg-brand text-white grid place-items-center shrink-0 mt-0.5 shadow-sm">
                  <BotMessageSquare className="h-3 w-3" />
                </div>
                <div className="max-w-[85%] space-y-1">
                  <div className="rounded-2xl rounded-tl-xs bg-[oklch(0.975_0.003_260)] px-3 py-2 text-[11px] leading-relaxed text-foreground">
                    Yes! Install our free WordPress plugin or paste our 1-line script tag.
                  </div>
                  <div className="flex gap-1">
                    <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded bg-brand/8 text-brand">WP Guide.pdf</span>
                    <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded bg-brand/8 text-brand">WooCommerce §2</span>
                  </div>
                </div>
              </div>
            )}

            {/* User message 2 */}
            {showUserMsg2 && (
              <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-brand text-white px-3 py-2 text-[11px] leading-relaxed shadow-sm">
                  Can I speak with a human support agent?
                </div>
              </div>
            )}

            {/* Handoff state */}
            {showHandoff && (
              <div className="flex flex-col items-center gap-0.5 py-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-[9.5px] font-semibold">
                  <User className="h-2.8 w-2.8" /> Agent Alex joined chat
                </div>
                <div className="text-[9px] text-foreground/35">Full transcript synced in realtime</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-border/40 flex items-center gap-1.5 bg-background">
            <input
              className="flex-1 text-[11px] px-2.5 py-1.5 rounded-xl bg-[oklch(0.975_0.003_260)] border border-border/30 outline-none text-foreground placeholder:text-foreground/25"
              placeholder="Type message…"
              readOnly
              value={
                step === 5
                  ? "Do you support WordPress & WooCommerce?"
                  : step === 8
                    ? "Can I speak with a human support agent?"
                    : ""
              }
            />
            <button className="h-6.5 w-6.5 rounded-xl bg-brand text-white grid place-items-center shrink-0 shadow-sm">
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
