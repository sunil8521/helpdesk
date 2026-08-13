"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { Workspace } from "@/lib/db/models/Workspace";
import { Agent } from "@/lib/db/models/Agent";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { updateTag } from "next/cache";
import { invalidateAgentCache } from "@/lib/ai/agent-cache";


export async function updateWorkspaceSettingsAction(data: { name: string }) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role !== "owner") return { error: "Only the workspace owner can modify settings" };

  if (!data.name || data.name.trim().length < 2) {
    return { error: "Workspace name must be at least 2 characters" };
  }


  await connectToDatabase();
  await Workspace.findByIdAndUpdate(ctx.workspace._id, {
    name: data.name.trim(),
  });

  updateTag(`settings-${ctx.workspace._id.toString()}`);

  return { success: true };
}


export async function updateAgentSettingsAction(data: {
  name?: string;
  role?: string;
  description?: string;
  tone?: "Friendly" | "Professional" | "Concise" | "Technical";
  responseLength?: "Minimalist" | "Standard" | "Detailed";
  temperature: number;
  confidenceThreshold: number;
  humanFallbackBehavior: "escalate" | "cannot";
}) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role !== "owner") return { error: "Only the workspace owner can modify settings" };

  if (!["escalate", "cannot"].includes(data.humanFallbackBehavior)) {
    return { error: "Invalid human fallback behavior option" };
  }


  if (!Number.isFinite(data.temperature) || data.temperature < 0 || data.temperature > 1) {
    return { error: "Temperature must be between 0 and 1" };
  }

  if (
    !Number.isFinite(data.confidenceThreshold) ||
    data.confidenceThreshold < 0 ||
    data.confidenceThreshold > 1
  ) {
    return { error: "Confidence threshold must be between 0 and 1" };
  }

  await connectToDatabase();
  await Agent.findOneAndUpdate(
    { workspaceId: ctx.workspace._id },
    {
      ...(data.name && { name: data.name.trim() }),
      ...(data.role && { role: data.role.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.tone && { tone: data.tone }),
      ...(data.responseLength && { responseLength: data.responseLength }),
      temperature: data.temperature,
      confidenceThreshold: data.confidenceThreshold,
      humanFallbackBehavior: data.humanFallbackBehavior,
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  invalidateAgentCache(ctx.workspace._id.toString());

  updateTag(`settings-${ctx.workspace._id.toString()}`);

  return { success: true };
}

import { Conversation } from "@/lib/db/models/Conversation";
import { Faq } from "@/lib/db/models/Faq";
import { Invite } from "@/lib/db/models/Invite";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { Message } from "@/lib/db/models/Message";
import { Vector } from "@/lib/db/models/Vector";
import { WidgetConfig } from "@/lib/db/models/WidgetConfig";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { User } from "@/lib/db/models/User";

export async function deleteWorkspaceAction() {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role !== "owner") return { error: "Only the workspace owner can delete the workspace" };

  await connectToDatabase();

  const workspaceId = ctx.workspace._id;

  // 1. Delete all related entities
  await Promise.all([
    Agent.deleteMany({ workspaceId }),
    Conversation.deleteMany({ workspaceId }),
    Faq.deleteMany({ workspaceId }),
    Invite.deleteMany({ workspaceId }),
    KnowledgeSource.deleteMany({ workspaceId }),
    Message.deleteMany({ workspaceId }),
    Vector.deleteMany({ workspaceId }),
    WidgetConfig.deleteMany({ workspaceId }),
    WorkspaceMember.deleteMany({ workspaceId }),
  ]);

  // 2. Delete the workspace itself
  await Workspace.findByIdAndDelete(workspaceId);

  // 3. Reset the user's onboarding state
  await User.findByIdAndUpdate(ctx.userId, { onboardingCompleted: false });

  // 4. Invalidate caches
  invalidateAgentCache(workspaceId.toString());

  return { success: true };
}
