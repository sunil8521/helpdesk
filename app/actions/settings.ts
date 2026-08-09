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
