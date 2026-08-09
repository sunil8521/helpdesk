import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { redirect } from "next/navigation";
import { getLeads } from "@/app/queries/leads";
import { LeadsTable } from "@/components/hendesk/leads-table";
import { Users } from "lucide-react";

import { Suspense } from "react";

export const metadata = {
  title: "Leads | Helpdesk",
  description: "View captured leads and visitors",
};

function LeadsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-full sm:w-64 bg-muted rounded-xl" />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs">
        <div className="w-full h-[400px] bg-muted/30" />
      </div>
    </div>
  );
}

async function LeadsDataStreamer({ workspaceObjectId, workspaceStringId }: { workspaceObjectId: string, workspaceStringId: string }) {
  const res = await getLeads(workspaceObjectId, workspaceStringId);
  const leads = res.success && res.leads ? res.leads : [];
  
  return <LeadsTable initialLeads={leads} />;
}

export default async function LeadsPage() {
  const ctx = await resolveUserWorkspace();
  if (!ctx) redirect("/login");

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header */}
      <div>
        <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full flex items-center w-fit gap-1.5">
          <Users className="h-3.5 w-3.5" /> Contacts
        </span>
        <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
          Captured <em className="font-display not-italic italic text-brand">Leads</em>
        </h1>
        <p className="mt-1 text-[14.5px] text-foreground/50">Manage visitors who have shared their contact details with your AI.</p>
      </div>

      <Suspense fallback={<LeadsSkeleton />}>
        <LeadsDataStreamer 
          workspaceObjectId={ctx.workspace._id.toString()} 
          workspaceStringId={ctx.workspace.workspaceId} 
        />
      </Suspense>
    </div>
  );
}
