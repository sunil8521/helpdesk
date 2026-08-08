import { Suspense } from "react";
import Link from "next/link";
import { getWorkspaceAndAgentSettings } from "@/app/queries/settings";
import { getDashboardStats } from "@/app/queries/dashboard";
import { getKnowledgeSources } from "@/app/queries/knowledge";
import { getInboxConversations } from "@/lib/chat/inbox-service";
import { WidgetPreview } from "@/components/hendesk/widget-preview";
import { DashboardRecentConversations } from "@/components/dashboard/dashboard-recent-conversations";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  UserCheck,
  Clock,
  Database,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function KPICard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
  accentBg,
  accentColor,
}: {
  icon: any;
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down";
  accentBg?: string;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs hover:border-brand/30 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-foreground/50">{label}</span>
        <div className={`h-8 w-8 rounded-xl ${accentBg || "bg-brand/8"} ${accentColor || "text-brand"} grid place-items-center`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-[24px] sm:text-[26px] font-bold tracking-tight text-foreground">{value}</div>
        {delta && (
          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
            tone === "down" ? "bg-red-50 text-red-600" : "bg-emerald/10 text-emerald"
          }`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse font-sans">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-6 w-32 bg-muted rounded-full" />
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        <div className="h-11 w-40 bg-muted rounded-full" />
      </div>
      
      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-2xl border border-border/50 p-5 shadow-2xs" />
        ))}
      </div>

      {/* Main Content Split Skeleton */}
      <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-6">
        <div className="h-96 bg-card rounded-3xl border border-border/50 p-6 shadow-2xs" />
        <div className="space-y-6">
          <div className="h-48 bg-card rounded-3xl border border-border/50 p-6 shadow-2xs" />
          <div className="h-56 bg-card rounded-3xl border border-border/50 p-6 shadow-2xs" />
        </div>
      </div>
    </div>
  );
}

async function OverviewDataStreamer() {
  const { workspace } = await getWorkspaceAndAgentSettings();
  const workspaceId = workspace.id;

  // Fetch real data from the database
  const [stats, knowledge, inbox] = await Promise.all([
    getDashboardStats(workspaceId),
    getKnowledgeSources(),
    getInboxConversations(workspaceId),
  ]);
  
  const MAX_REQUESTS = 10000;
  const requestsUsed = workspace.apiCallsUsed || 0;
  const tokensUsed = workspace.tokensUsed || 0;
  const percentUsed = Math.min(100, Math.round((requestsUsed / MAX_REQUESTS) * 100));

  // Calculate total chunks
  const totalChunks = ((knowledge as any).sources || []).reduce(
    (acc: number, curr: any) => acc + (curr.chunksCount || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            Workspace Dashboard
          </span>
          <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            {workspace.name} <em className="font-display not-italic italic text-brand">workspace</em>
          </h1>
          <p className="mt-1 text-[14.5px] text-foreground/50">Welcome back! Here is your AI support performance overview.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/widget"
            className="px-5 h-11 rounded-full bg-brand   border border-border/60 text-[14px] font-semibold text-white hover:text-foreground hover:border-foreground/20 flex items-center gap-2 transition-all shadow-2xs"
          >
            <span>Customize Widget</span>
          </Link>
        
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={MessageSquare} label="Conversations" value={stats.totalConversations.toLocaleString()} accentBg="bg-brand/8" accentColor="text-brand" />
        <KPICard icon={UserCheck} label="Human Handoffs" value={stats.humanHandoffs.toLocaleString()} accentBg="bg-amber/10" accentColor="text-amber" />
        <KPICard icon={Clock} label="Avg Response" value={stats.avgResponseTimeFormatted} accentBg="bg-emerald/10" accentColor="text-emerald" />
        <KPICard icon={Database} label="Knowledge Chunks" value={totalChunks.toLocaleString()} accentBg="bg-blue-50" accentColor="text-blue-600" />
      </div>

      {/* Main Content Split: Table + Sidebar Stats */}
      <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-6">
        {/* Recent Conversations Table */}
        <DashboardRecentConversations 
          initialConversations={inbox.conversations || []} 
          totalCount={stats.totalConversations} 
        />

        {/* Right Sidebar: AI Performance & Checklist */}
        <div className="space-y-6">

          {/* API Usage & Credits */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand" />
                <h3 className="font-bold text-[16px] tracking-tight">AI Credits</h3>
              </div>
              <span className="text-[14px] font-bold text-brand">{percentUsed}%</span>
            </div>
            
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: `${percentUsed}%` }} />
              </div>
              <p className="text-[13px] font-medium text-foreground/50">
                {requestsUsed.toLocaleString()} / {MAX_REQUESTS.toLocaleString()} requests used
              </p>
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground/50">Total Tokens</span>
                <span className="text-[14px] font-bold">{tokensUsed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Widget Preview Banner Section */}
   
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewDataStreamer />
      </Suspense>
    </div>
  );
}


