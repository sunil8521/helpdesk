import { Suspense } from "react";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { getKnowledgeSources } from "@/app/queries/knowledge";
import { KnowledgeClientView } from "@/components/knowledge/knowledge-client-view";

export const metadata = { title: "Knowledge Base" };
import { KnowledgeQuickAdd } from "@/components/knowledge/knowledge-quick-add";

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

      <div className="h-32 bg-card rounded-3xl border border-border/40 p-6 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-11 w-full bg-muted/50 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card rounded-2xl border border-border/40 p-5 space-y-2">
            <div className="h-3.5 w-24 bg-muted rounded" />
            <div className="h-7 w-16 bg-muted/80 rounded-lg" />
            <div className="h-3 w-28 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      <div className="h-64 bg-card rounded-3xl border border-border/40" />
    </div>
  );
}

async function KnowledgeDataStreamer({ workspaceId, role }: { workspaceId: string; role?: string }) {
  const res = await getKnowledgeSources();
  const initialSources = (res as any).sources || [];

  return (
    <KnowledgeClientView initialSources={initialSources} workspaceId={workspaceId} role={role} />
  );
}

export default async function KnowledgePage() {
  const ctx = await resolveUserWorkspace();
  const workspaceId = ctx?.workspaceId!;

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-2 sm:px-3 py-1 rounded-full">
            RAG Knowledge Base
          </span>
          <h1 className="mt-2 sm:mt-2.5 text-[24px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Knowledge <em className="font-display not-italic italic text-brand">Base</em>
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14.5px] text-foreground/50">Manage documents, scraped URLs, raw text, and vector embeddings cited by your AI agent.</p>
        </div>
      </div>

      {ctx?.role !== "agent" && (
        <KnowledgeQuickAdd workspaceId={workspaceId} />
      )}
      <Suspense fallback={<KnowledgeSkeleton />}>
        <KnowledgeDataStreamer workspaceId={workspaceId} role={ctx?.role} />
      </Suspense>
    </div>
  );
}
