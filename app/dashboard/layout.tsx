import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUnresolvedConversationsCount } from "@/lib/chat/inbox-service";

import { connectToDatabase } from "@/lib/db/connect";
import { Workspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { StoreProvider } from "@/store/store-provider";
import { DashboardShell } from "@/components/hendesk/dashboard-shell";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  const userId = (session.user as any).id;

  // Query workspace membership for this user
  const memberDoc = await WorkspaceMember.findOne({ userId });
  let activeWorkspace = null;

  if (memberDoc) {
    const workspaceDoc = await Workspace.findById(memberDoc.workspaceId);
    if (workspaceDoc) {
      activeWorkspace = {
        id: workspaceDoc._id.toString(),
        workspaceId: workspaceDoc.workspaceId,
        name: workspaceDoc.name,
        slug: workspaceDoc.slug,
        plan: workspaceDoc.plan,
      };
    }
  }

  const serializedUser = {
    id: userId,
    email: session.user.email as string,
    name: session.user.name || "",
    avatarUrl: session.user.image || "",
  };

  let inboxCount = 0;
  if (activeWorkspace) {
    inboxCount = await getUnresolvedConversationsCount(activeWorkspace.id);
  }

  return (
    <StoreProvider user={serializedUser} workspace={activeWorkspace}>
      <DashboardShell inboxCount={inboxCount}>
        {children}
      </DashboardShell>
    </StoreProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center py-20"><Loader2 className="animate-spin text-brand" /></div>}>
      <DashboardDataProvider>
        {children}
      </DashboardDataProvider>
    </Suspense>
  );
}
