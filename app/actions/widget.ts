"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { Agent } from "@/lib/db/models/Agent";
import { WidgetConfig } from "@/lib/db/models/WidgetConfig";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { updateTag } from "next/cache";

export async function updateWidgetConfigAction(data: {
  title?: string;
  greeting?: string;
  themeColor?: string;
  buttonColor?: string;
  position?: "left" | "right";
  proactiveMessage?: boolean;
  leadCapture?: {
    enabled: boolean;
    requiredFields: string[];
  };
}) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role === "agent") return { error: "Only admins and owners can modify widget settings" };

  await connectToDatabase();

  const widgetConfig = await WidgetConfig.findOne({ workspaceId: ctx.workspace._id });

  if (widgetConfig) {
    if (data.title !== undefined) widgetConfig.title = data.title;
    if (data.greeting !== undefined) widgetConfig.greeting = data.greeting;
    if (data.themeColor !== undefined) widgetConfig.themeColor = data.themeColor;
    if (data.buttonColor !== undefined) widgetConfig.buttonColor = data.buttonColor;
    if (data.position !== undefined) widgetConfig.position = data.position;
    if (data.proactiveMessage !== undefined) widgetConfig.proactiveMessage = data.proactiveMessage;
    if (data.leadCapture !== undefined) widgetConfig.leadCapture = data.leadCapture;
    await widgetConfig.save();
  } else {
    // This shouldn't normally happen if onboarding created it, but just in case
    await WidgetConfig.create({
      workspaceId: ctx.workspace._id,
      title: data.title || "Acme Support",
      greeting: data.greeting || "Hi 👋 How can we help today?",
      themeColor: data.themeColor || "#4f46e5",
      buttonColor: data.buttonColor || "#4f46e5",
      position: data.position || "right",
      proactiveMessage: data.proactiveMessage ?? true,
      leadCapture: data.leadCapture || { enabled: false, requiredFields: [] },
    });
  }

  // Next 16 Tag Invalidation
  updateTag(`widgetConfig-${ctx.workspace._id.toString()}`);

  return { success: true };
}
