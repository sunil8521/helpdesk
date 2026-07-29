import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { User, IUser } from "@/lib/db/models/User";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";

export interface FormattedTeamMember {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role: "owner" | "admin" | "agent";
  status: "online" | "offline" | "in_chat";
  assignedChatsCount: number;
  joinedAt?: Date;
  updatedAt?: Date;
}

export async function getTeamMembers() {
  try {
    const ctx = await resolveUserWorkspace();
    if (!ctx) return { success: false, error: "Unauthorized", members: [], workspaceName: "" };

    return await fetchTeamMembersCached(ctx.workspace._id.toString(), ctx.workspace.name);
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to fetch team members",
      members: [],
      workspaceName: "",
    };
  }
}

async function fetchTeamMembersCached(workspaceObjectId: string, workspaceName: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`team-${workspaceObjectId}`);

  await connectToDatabase();

  const members = await WorkspaceMember.find({ workspaceId: workspaceObjectId })
    .populate<{ userId: IUser }>("userId", "name email avatarUrl updatedAt")
    .lean();

  const memberList = members.map((m) => {
    const user = m.userId;
    return {
      id: m._id.toString(),
      userId: user?._id?.toString(),
      name: user?.name,
      email: user?.email,
      avatarUrl: user?.avatarUrl,
      role: m.role,
      status: m.status,
      assignedChatsCount: m.assignedChatsCount,
      joinedAt: m.joinedAt,
      updatedAt: user?.updatedAt,
    };
  });

  return {
    success: true,
    error: undefined as string | undefined,
    members: memberList,
    workspaceName,
  };
}
