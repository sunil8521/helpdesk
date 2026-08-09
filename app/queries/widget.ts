import { connectToDatabase } from "@/lib/db/connect";
import { WidgetConfig } from "@/lib/db/models/WidgetConfig";
import { Workspace } from "@/lib/db/models/Workspace";
import { Agent } from "@/lib/db/models/Agent";
import { cacheTag } from "next/cache";

// Fetch widget styling & agent header configuration for dashboard preview
export async function getWidgetConfig(workspaceObjectId: string, workspaceStringId: string) {
  "use cache";
  cacheTag(`widgetConfig-${workspaceObjectId}`);

  try {
    await connectToDatabase();

    const [widgetConfig, agent] = await Promise.all([
      WidgetConfig.findOne({ workspaceId: workspaceObjectId }).lean(),
      Agent.findOne({ workspaceId: workspaceObjectId }).select("name role").lean(),
    ]);

    return {
      success: true,
      config: widgetConfig ? JSON.parse(JSON.stringify(widgetConfig)) : null,
      agentInfo: agent ? { name: agent.name, role: agent.role } : null,
      workspaceId: workspaceStringId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch widget configuration",
    };
  }
}

// Fetch public widget config for embedded chat widget script on customer websites
export async function getPublicWidgetConfigBySlug(workspaceStringId: string) {
  try {
    await connectToDatabase();

    const workspace = await Workspace.findOne({ workspaceId: workspaceStringId }).lean();
    if (!workspace) return { success: false, error: "Workspace not found" };

    const [widgetConfig, agent] = await Promise.all([
      WidgetConfig.findOne({ workspaceId: workspace._id }).lean(),
      Agent.findOne({ workspaceId: workspace._id }).lean(),
    ]);

    return {
      success: true,
      config: widgetConfig,
      agent: agent,
      workspaceOid: workspace._id.toString()
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch embed widget config",
    };
  }
}
