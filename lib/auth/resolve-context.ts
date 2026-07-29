"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type IUser } from "@/lib/db/models/User";
import { Workspace, type IWorkspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";

export interface ResolvedContext {
  userId: string;
  user: IUser;
  workspace: IWorkspace;
  workspaceId: string; // human-readable ws_xxxx
}


export async function resolveUserWorkspace(): Promise<ResolvedContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = (session.user as Record<string, unknown>)?.id as
    | string
    | undefined;
  if (!userId) return null;

  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) return null;

  // Find workspace via membership (supports multi-tenant later)
  const membership = await WorkspaceMember.findOne({ userId });
  if (!membership) return null;

  const workspace = await Workspace.findById(membership.workspaceId);
  if (!workspace) return null;

  return {
    userId,
    user,
    workspace,
    workspaceId: workspace.workspaceId, // human-readable ws_xxxx
  };
}
