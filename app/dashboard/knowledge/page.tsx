import { Suspense } from "react";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { getKnowledgeSources } from "@/app/queries/knowledge";
import { KnowledgeClientView } from "@/components/knowledge/knowledge-client-view";

function KnowledgeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse font-sans">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded-full" />
          <div className="h-8 w-64 bg-muted rounded-xl" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        <div className="h-11 w-44 bg-muted/70 rounded-full" />
      </div>

      {/* Quick Action Bar Skeleton */}
      <div className="h-32 bg-card rounded-3xl border border-border/40 p-6 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-11 w-full bg-muted/50 rounded-xl" />
      </div>

      {/* KPI Skeleton Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card rounded-2xl border border-border/40 p-5 space-y-2">
            <div className="h-3.5 w-24 bg-muted rounded" />
            <div className="h-7 w-16 bg-muted/80 rounded-lg" />
            <div className="h-3 w-28 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 bg-card rounded-3xl border border-border/40" />
    </div>
  );
}

async function KnowledgeDataStreamer({ workspaceId }: { workspaceId: string }) {
  const res = await getKnowledgeSources();
  const initialSources = (res as any).sources || [];

  return (
    <KnowledgeClientView initialSources={initialSources} workspaceId={workspaceId} />
  );
}

export default async function KnowledgePage() {
  const ctx = await resolveUserWorkspace();
  const workspaceId = ctx?.workspaceId || "";

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <Suspense fallback={<KnowledgeSkeleton />}>
        <KnowledgeDataStreamer workspaceId={workspaceId} />
      </Suspense>
    </div>
  );
}
