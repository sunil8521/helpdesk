import Link from "next/link";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { DashboardPreview } from "@/components/hendesk/dashboard-preview";
import { WidgetPreview } from "@/components/hendesk/widget-preview";
import { HeroAnimatedPreview } from "@/components/hendesk/hero-animated-preview";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/hendesk/mobile-nav";
import {
  ArrowRight,
  Bot,
  Users,
  Inbox,
  Upload,
  Globe,
  ShieldCheck,
  Zap,
  Palette,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronRight,
  Star,
  Play,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Headphones,
} from "lucide-react";

const NAV_ITEMS = ["Product", "Workflow", "Knowledge", "Handoff", "Pricing"];



export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-brand/20 overflow-x-hidden">

      {/* ═══════════ Navbar ═══════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 h-[68px] sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="shrink-0"><HelpdeskLogo /></Link>
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-[15px] font-medium text-foreground/55 hover:text-foreground rounded-lg hover:bg-foreground/[0.04] transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-[15px] font-medium text-foreground/60 hover:text-foreground rounded-lg hover:bg-foreground/[0.04] transition-all duration-200"
            >
              Login
            </Link>
            <Button asChild className="hidden sm:inline-flex bg-brand text-brand-foreground hover:bg-brand/85 px-6 h-10 sm:h-11 text-[14px] sm:text-[15px] font-semibold rounded-full shadow-md shadow-brand/15 hover:shadow-lg hover:shadow-brand/25 transition-all duration-300">
              <Link href="/signup">
                Start free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            {/* Mobile navigation menu */}
            <MobileNav items={NAV_ITEMS} />
          </div>
        </div>
      </header>

      {/* ═══════════ Hero ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-brand/[0.04] via-brand/[0.02] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-14 items-center">
          <div>
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2.5 text-[13px] font-semibold px-4 py-2 rounded-full border border-emerald/25 bg-emerald/[0.06] text-emerald tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald" />
              </span>
              Now with realtime human handoff
            </div>

            {/* Headline — mixed typography */}
            <h1 className="mt-6 sm:mt-8 text-[28px] sm:text-[48px] md:text-[64px] lg:text-[72px] leading-[1.1] sm:leading-[1.06] font-bold tracking-[-0.03em]">
              AI support for{" "}
              <span className="font-display italic text-brand">WordPress</span>
              , Wix, &amp;{" "}
              <span className="font-display italic text-brand">Webflow.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-7 text-[18px] md:text-[20px] leading-[1.7] text-foreground/55 max-w-[540px]">
              Add a smart chat widget to your website, answer customers from your knowledge base, and hand off to human agents when needed.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button asChild className="w-full sm:w-auto bg-brand text-brand-foreground hover:bg-brand/85 px-8 h-12 sm:h-[52px] text-[15px] sm:text-[16px] font-semibold rounded-full shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 transition-all duration-300">
                <Link href="/signup" className="flex items-center justify-center">
                  Start free
                  <ArrowRight className="ml-2 h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto px-8 h-12 sm:h-[52px] text-[15px] sm:text-[16px] font-semibold rounded-full border-2 border-border/80 hover:border-foreground/20 hover:bg-muted/40 transition-all duration-300">
                <Link href="/dashboard" className="flex items-center justify-center">
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  View demo
                </Link>
              </Button>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[14px] text-foreground/45 font-medium">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-[18px] w-[18px] text-emerald" /> No credit card</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-[18px] w-[18px] text-emerald" /> 5 min setup</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-[18px] w-[18px] text-emerald" /> GDPR ready</span>
            </div>
          </div>

          {/* Hero visual — Interactive animated demo */}
          <div className="relative hidden lg:flex justify-end items-center">
            {/* Glow behind */}
            <div className="absolute -inset-6 bg-gradient-to-br from-brand/[0.08] via-transparent to-emerald/[0.05] rounded-3xl blur-3xl -z-10" />
            <HeroAnimatedPreview />
          </div>
        </div>
      </section>

      {/* ═══════════ Platform strip ═══════════ */}
      <div className="border-y border-border/40">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-5 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-[12px] sm:text-[13px] text-foreground/35 font-semibold uppercase tracking-[0.2em]">Runs natively on</div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-10 md:gap-14 text-[14px] sm:text-[16px] font-semibold tracking-tight">
            <span className="text-foreground/70">WordPress</span>
            <span className="text-foreground/70 font-display italic">Wix</span>
            <span className="text-foreground/70">Webflow</span>
            <span className="text-foreground/35">Shopify</span>
            <span className="text-foreground/35">Custom sites</span>
          </div>
        </div>
      </div>

      {/* ═══════════ Workflow ═══════════ */}
      <section id="workflow" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Workflow"
            title={<>From install to resolved in <em className="font-display not-italic italic text-brand">four steps</em></>}
            subtitle="A production-ready support stack — AI first, humans when it matters."
          />
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "01", t: "Install widget", d: "Paste one script tag on your site or use our WordPress, Wix, and Webflow guides." },
              { n: "02", t: "Upload docs or crawl", d: "Bring PDFs, articles, or point the crawler at your site. We chunk and embed automatically." },
              { n: "03", t: "AI answers", d: "Gemini answers only from your knowledge base with source citations." },
              { n: "04", t: "Human takes over", d: "Agents accept handoff in the shared inbox and continue the conversation seamlessly." },
            ].map((s) => (
              <div key={s.n} className="group relative rounded-2xl border border-border/60 bg-card p-5 sm:p-8 hover:border-brand/25 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] transition-all duration-500">
                <span className="text-[13px] font-mono font-semibold text-brand/40 tracking-wider">{s.n}</span>
                <h3 className="mt-5 text-[20px] font-bold tracking-[-0.02em] leading-snug">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-foreground/50">{s.d}</p>
                {/* Hover accent line */}
                <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-brand/0 group-hover:bg-brand/60 rounded-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Product features ═══════════ */}
      <section id="product" className="py-28 md:py-36 bg-[oklch(0.985_0.003_260)]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Product"
            title={<>Everything you need to <em className="font-display not-italic italic text-brand">run support</em></>}
            subtitle="One platform for AI-first conversations, knowledge management, and human agents."
          />
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { i: Bot, t: "AI chat widget", d: "Embed on any site with a single script. Answers are cited from your knowledge base." },
              { i: Users, t: "Human handoff", d: "Escalate to agents mid-conversation with full context and chat history." },
              { i: Inbox, t: "Shared inbox", d: "Realtime dashboard for the whole team with assignment and resolution tracking." },
              { i: Upload, t: "Knowledge uploads", d: "PDFs, TXT, MD — chunked and embedded automatically into your vector store." },
              { i: Globe, t: "Website crawler", d: "Same-origin crawling that respects robots.txt. Auto-updates on schedule." },
              { i: ShieldCheck, t: "Tenant isolation", d: "Every query scoped to your workspace. Zero data leakage across tenants." },
              { i: Zap, t: "Realtime engine", d: "Socket-powered conversations that keep visitors, AI, and agents in sync." },
              { i: Palette, t: "Brand customization", d: "Colors, position, greeting, logo — make the widget match your brand perfectly." },
            ].map((f) => (
              <div key={f.t} className="group rounded-2xl border border-border/60 bg-card p-7 hover:border-brand/25 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] transition-all duration-500">
                <div className="h-12 w-12 rounded-xl bg-brand/8 text-brand grid place-items-center group-hover:bg-brand group-hover:text-white transition-all duration-400">
                  <f.i className="h-[22px] w-[22px]" />
                </div>
                <h3 className="mt-5 text-[18px] font-bold tracking-[-0.02em]">{f.t}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.7] text-foreground/50">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Dashboard screenshot ═══════════ */}
      <section id="handoff" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Shared Inbox"
            title={<>A dashboard your agents will <em className="font-display not-italic italic text-brand">actually use</em></>}
            subtitle="Every conversation — AI or human — routed to the right place with citations, context, and history."
          />
          <div className="mt-10 sm:mt-16 rounded-[20px] border border-border/40 bg-[oklch(0.985_0.003_260)] p-3 sm:p-5 md:p-10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.08)] overflow-x-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ═══════════ Knowledge ═══════════ */}
      <section id="knowledge" className="py-28 md:py-36 bg-[oklch(0.985_0.003_260)]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Knowledge Base"
            title={<>Your docs. Your <em className="font-display not-italic italic text-brand">answers.</em></>}
            subtitle="Upload files or point us at your site. We chunk, embed, and keep the index fresh."
          />
          <div className="mt-10 sm:mt-16 grid md:grid-cols-2 gap-6">
            {/* Documents card */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-8">
              <h3 className="text-[18px] sm:text-[20px] font-bold tracking-[-0.02em]">Documents</h3>
              <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                {[
                  { n: "Refund Policy.pdf", s: "Completed", i: CheckCircle2, c: "text-emerald" },
                  { n: "Onboarding Guide.md", s: "Embedding", i: Loader2, c: "text-brand animate-spin" },
                  { n: "Product FAQ.pdf", s: "Chunked", i: FileText, c: "text-foreground/40" },
                ].map((d) => (
                  <div key={d.n} className="flex items-center justify-between rounded-xl border border-border/50 bg-background px-3.5 py-3 sm:px-5 sm:py-4 gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-foreground/30 shrink-0" />
                      <div className="text-[13.5px] sm:text-[15px] font-medium truncate">{d.n}</div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] text-foreground/45 font-medium shrink-0">
                      <d.i className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${d.c}`} /> {d.s}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Crawler card */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-8">
              <h3 className="text-[18px] sm:text-[20px] font-bold tracking-[-0.02em]">Crawler — acme.co</h3>
              <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] text-foreground/40 font-medium">Same-origin only · Respects robots.txt</p>
              <div className="mt-5 sm:mt-7 h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: "68%" }} />
              </div>
              <div className="mt-5 sm:mt-7 grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
                {[
                  { v: "124", l: "Discovered" },
                  { v: "84", l: "Crawled" },
                  { v: "612", l: "Chunks" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-muted/40 py-3 sm:py-5 px-1">
                    <div className="text-[20px] sm:text-[28px] font-bold tracking-tight">{s.v}</div>
                    <div className="text-[9.5px] sm:text-[11px] text-foreground/35 uppercase tracking-[0.1em] sm:tracking-[0.15em] font-semibold mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Handoff flow ═══════════ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Human Handoff"
            title={<>AI handles the volume. Humans handle the <em className="font-display not-italic italic text-brand">moments.</em></>}
            subtitle="When the AI isn't confident, it escalates — instantly. Your agents join mid-conversation with full context."
          />

          {/* ── Desktop: horizontal flow ── */}
          <div className="mt-20 hidden md:block">
            {/* Steps row */}
            <div className="grid grid-cols-5 gap-0">
              {([
                { n: 1, t: "Customer", d: "Asks a question on your site via the chat widget", Icon: MessageSquare, color: "text-foreground/70", bg: "bg-foreground/[0.04]" },
                { n: 2, t: "AI responds", d: "Gemini answers from your knowledge base with source citations", Icon: Sparkles, color: "text-brand", bg: "bg-brand/[0.06]" },
                { n: 3, t: "Escalation", d: "Low confidence detected — or visitor asks for a human", Icon: AlertTriangle, color: "text-amber", bg: "bg-amber/[0.08]" },
                { n: 4, t: "Agent joins", d: "Human agent accepts handoff with full context and history", Icon: Headphones, color: "text-emerald", bg: "bg-emerald/[0.06]" },
                { n: 5, t: "Resolved", d: "Conversation closed with transcript and satisfaction rating", Icon: CheckCircle2, color: "text-foreground/60", bg: "bg-foreground/[0.04]" },
              ] as const).map((s, i, arr) => (
                <div key={s.n} className="flex items-start">
                  {/* Step content */}
                  <div className="flex-1 flex flex-col items-center text-center px-3">
                    {/* Icon circle */}
                    <div className={`relative h-16 w-16 rounded-2xl ${s.bg} grid place-items-center`}>
                      <s.Icon className={`h-6 w-6 ${s.color}`} />
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background text-[10px] font-bold grid place-items-center">{s.n}</span>
                    </div>
                    {/* Text */}
                    <h4 className="mt-5 text-[17px] font-bold tracking-[-0.02em]">{s.t}</h4>
                    <p className="mt-2 text-[14px] leading-[1.65] text-foreground/40 max-w-[200px]">{s.d}</p>
                  </div>
                  {/* Arrow connector */}
                  {i < arr.length - 1 && (
                    <div className="flex items-center pt-7 -mx-2">
                      <div className="w-8 h-[1.5px] bg-border" />
                      <ChevronRight className="h-4 w-4 text-foreground/20 -ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary bar */}
            <div className="mt-14 rounded-2xl bg-[oklch(0.985_0.003_260)] border border-border/40 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[14px]">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <span className="text-foreground/50 font-medium">~76% resolved by AI</span>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber" />
                  <span className="text-foreground/50 font-medium">~16% escalated</span>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald" />
                  <span className="text-foreground/50 font-medium">Avg 1m 48s response</span>
                </div>
              </div>
              <span className="text-[13px] text-foreground/30 font-medium">Based on active workspaces</span>
            </div>
          </div>

          {/* ── Mobile: vertical timeline ── */}
          <div className="mt-14 md:hidden">
            <div className="space-y-0">
              {([
                { n: 1, t: "Customer", d: "Asks a question on your site via the chat widget", Icon: MessageSquare, color: "text-foreground/70", bg: "bg-foreground/[0.04]" },
                { n: 2, t: "AI responds", d: "Gemini answers from your knowledge base with source citations", Icon: Sparkles, color: "text-brand", bg: "bg-brand/[0.06]" },
                { n: 3, t: "Escalation", d: "Low confidence detected — or visitor asks for a human", Icon: AlertTriangle, color: "text-amber", bg: "bg-amber/[0.08]" },
                { n: 4, t: "Agent joins", d: "Human agent accepts handoff with full context and history", Icon: Headphones, color: "text-emerald", bg: "bg-emerald/[0.06]" },
                { n: 5, t: "Resolved", d: "Conversation closed with transcript and satisfaction rating", Icon: CheckCircle2, color: "text-foreground/60", bg: "bg-foreground/[0.04]" },
              ] as const).map((s, i, arr) => (
                <div key={s.n} className="flex gap-5">
                  {/* Left: icon + line */}
                  <div className="flex flex-col items-center">
                    <div className={`relative h-12 w-12 rounded-xl ${s.bg} grid place-items-center shrink-0`}>
                      <s.Icon className={`h-5 w-5 ${s.color}`} />
                      <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-foreground text-background text-[9px] font-bold grid place-items-center">{s.n}</span>
                    </div>
                    {i < arr.length - 1 && <div className="w-[1.5px] flex-1 min-h-6 bg-border my-2" />}
                  </div>
                  {/* Right: text */}
                  <div className="pb-8">
                    <h4 className="text-[17px] font-bold tracking-[-0.02em] mt-0.5">{s.t}</h4>
                    <p className="mt-1.5 text-[14px] leading-[1.65] text-foreground/40">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Social proof ═══════════ */}
      <section className="py-28 md:py-36 bg-[oklch(0.985_0.003_260)]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Trusted by teams"
            title={<>Teams ship better support with <em className="font-display not-italic italic text-brand">Helpdesk</em></>}
          />
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { q: "We replaced Intercom with Helpdesk and our resolution rate went from 40% to 78% in two weeks.", n: "Sarah K.", r: "Head of Support, Acme Inc.", s: 5 },
              { q: "The AI handles the repetitive questions perfectly. Our team now focuses only on complex cases.", n: "Marcus W.", r: "CTO, NovaPay", s: 5 },
              { q: "Setup took 10 minutes. Uploaded our docs, pasted the script tag, and the widget was live.", n: "Priya N.", r: "Founder, CloudBase", s: 5 },
            ].map((t) => (
              <div key={t.n} className="rounded-2xl border border-border/60 bg-card p-5 sm:p-8 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] transition-all duration-500">
                <div className="flex gap-1">
                  {Array.from({ length: t.s }).map((_, i) => (
                    <Star key={i} className="h-[18px] w-[18px] text-amber fill-amber" />
                  ))}
                </div>
                <p className="mt-6 text-[16px] leading-[1.75] text-foreground/70">&ldquo;{t.q}&rdquo;</p>
                <div className="mt-7 pt-6 border-t border-border/40 flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-full bg-brand/8 text-brand grid place-items-center text-[14px] font-bold">
                    {t.n.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{t.n}</div>
                    <div className="text-[13px] text-foreground/40">{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Final CTA ═══════════ */}
      <section id="pricing" className="py-28 md:py-36">
        <div className="mx-auto max-w-[880px] px-6 lg:px-10 text-center">
          <h2 className="text-[28px] sm:text-[48px] md:text-[60px] font-bold tracking-[-0.03em] leading-[1.1]">
            Launch your AI{" "}
            <em className="font-display not-italic italic text-brand">support desk.</em>
          </h2>
          <p className="mt-6 text-[18px] md:text-[20px] text-foreground/50 leading-[1.7] max-w-2xl mx-auto">
            Free for the first 100 conversations. No credit card required. Set up in under 5 minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/85 px-10 h-[56px] text-[17px] font-semibold rounded-full shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 transition-all duration-300">
              <Link href="/signup">
                Start free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-10 h-[56px] text-[17px] font-semibold rounded-full border-2 hover:border-foreground/20 transition-all duration-300">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="border-t border-border/40 bg-[oklch(0.985_0.003_260)]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[1.8fr_1fr_1fr_1fr] gap-10 lg:gap-12">
            {/* Brand column — full width on mobile */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1">
              <HelpdeskLogo />
              <p className="mt-4 text-[15px] text-foreground/40 max-w-[320px] leading-[1.7]">
                AI-first customer support for modern websites. Built for teams who care about their customers.
              </p>
            </div>
            {/* Link columns — 2-col grid on mobile, 3 cols on sm+ */}
            {[
              { t: "Product", items: ["Widget", "Inbox", "Knowledge", "Crawler"] },
              { t: "Platforms", items: ["WordPress", "Wix", "Webflow", "Custom"] },
              { t: "Company", items: ["About", "Security", "Privacy", "Contact"] },
            ].map((c) => (
              <div key={c.t}>
                <div className="text-[13px] font-bold uppercase tracking-[0.15em] text-foreground/70">{c.t}</div>
                <ul className="mt-4 sm:mt-5 space-y-3">
                  {c.items.map((i) => (
                    <li key={i}>
                      <a href="#" className="text-[15px] text-foreground/40 hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1 group">
                        {i}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border/40">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] sm:text-[14px] text-foreground/30">
            <div>© 2026 Helpdesk, Inc.</div>
            <div>Made for support teams.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}


/* ── Reusable section header ── */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</span>
      {/* Decorative line under eyebrow */}
      <div className="mt-3 flex justify-center">
        <div className="h-[3px] w-10 rounded-full bg-brand/40" />
      </div>
      <h2 className="mt-4 sm:mt-6 text-[26px] sm:text-[42px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.12]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-[18px] text-foreground/50 leading-[1.7] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
