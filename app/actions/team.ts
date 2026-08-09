"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Invite } from "@/lib/db/models/Invite";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { sendWorkspaceInviteEmail } from "@/lib/email";

export async function inviteTeamMemberAction(email: string, role: "owner" | "admin" | "agent") {
  try {
    const ctx = await resolveUserWorkspace();
    if (!ctx) return { success: false, error: "Unauthorized" };

    // 1. Verify the current user has permission to invite (must be owner or admin)
    await connectToDatabase();
    const currentMember = await WorkspaceMember.findOne({
      workspaceId: ctx.workspace._id,
      userId: ctx.userId,
    }).lean();

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return { success: false, error: "Only admins or owners can invite new members." };
    }

    // 2. Validate input
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, error: "Please provide a valid email address." };
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // 4. Create or update invite (if an invite already exists for this email, overwrite the token/expiration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    const invite = await Invite.findOneAndUpdate(
      { workspaceId: ctx.workspace._id, email: normalizedEmail },
      {
        role,
        token,
        status: "pending",
        invitedByUserId: ctx.userId,
        expiresAt,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 5. Send email
    await sendWorkspaceInviteEmail({
      to: normalizedEmail,
      workspaceName: ctx.workspace.name,
      inviterName: ctx.user.name || "A team member",
      role,
      token,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Invite Error:", err);
    return { success: false, error: err.message || "Failed to send invitation." };
  }
}
