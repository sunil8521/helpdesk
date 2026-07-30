import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

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

  return (
    <StoreProvider user={serializedUser} workspace={activeWorkspace}>
      {children}
    </StoreProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center py-20"><Loader2 className="animate-spin text-brand" /></div>}>
      <DashboardDataProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </DashboardDataProvider>
    </Suspense>
  );
}
