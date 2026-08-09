"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Agent } from "@/lib/db/models/Agent";
import { WidgetConfig } from "@/lib/db/models/WidgetConfig";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { inngest } from "@/lib/inngest/client";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { invalidateAgentCache } from "@/lib/ai/agent-cache";


export async function saveOnboardingProgressAction(data: {
  agentName?: string;
  agentRole?: string;
  agentPrompt?: string;
  avatarUrl?: string;
  tone?: "Friendly" | "Professional" | "Concise" | "Technical";
  responseLength?: "Minimalist" | "Standard" | "Detailed";
  greetingMsg?: string;
  themeColor?: string;
  position?: "right" | "left";
  sourceIds?: string[];
}) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  const { workspace, workspaceId } = ctx;

  await Agent.findOneAndUpdate(
    { workspaceId: workspace._id },
    {
      ...(data.agentName && { name: data.agentName }),
      ...(data.agentRole && { role: data.agentRole }),
      ...(data.agentPrompt && { description: data.agentPrompt }),
      ...(data.tone && { tone: data.tone }),
      ...(data.responseLength && { responseLength: data.responseLength }),
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  invalidateAgentCache(workspace._id.toString());

  await WidgetConfig.findOneAndUpdate(
    { workspaceId: workspace._id },
    {
      ...(data.agentName && { title: `${data.agentName} Support` }),
      ...(data.greetingMsg && { greeting: data.greetingMsg }),
      ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      ...(data.themeColor && {
        themeColor: data.themeColor,
        buttonColor: data.themeColor,
      }),
      ...(data.position && { position: data.position }),
    },
    { upsert: true }
  );


  return { success: true };
}


export async function finishOnboardingAction(data: {
  agentName: string;
  agentRole: string;
  agentPrompt: string;
  avatarUrl: string;
  tone: "Friendly" | "Professional" | "Concise" | "Technical";
  responseLength: "Minimalist" | "Standard" | "Detailed";
  greetingMsg: string;
  themeColor: string;
  position: "right" | "left";
  sourceIds?: string[];
}) {
  await saveOnboardingProgressAction(data);

  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  await connectToDatabase();
  await User.findByIdAndUpdate(ctx.userId, {
    onboardingCompleted: true,
  });

  revalidatePath("/dashboard");
  return { success: true };
}
