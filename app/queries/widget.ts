import { connectToDatabase } from "@/lib/db/connect";
import { WidgetConfig } from "@/lib/db/models/WidgetConfig";
import { Workspace } from "@/lib/db/models/Workspace";
import { Agent } from "@/lib/db/models/Agent";
import { cacheTag } from "next/cache";

export async function getWidgetConfig(workspaceObjectId: string, workspaceStringId: string) {
  "use cache";

  try {
    await connectToDatabase();

    const widgetConfig = await WidgetConfig.findOne({ workspaceId: workspaceObjectId }).lean();

    // Next 16 dynamic tag caching
    cacheTag(`widgetConfig-${workspaceObjectId}`);

    return {
      success: true,
      config: widgetConfig,
      workspaceId: workspaceStringId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch widget configuration",
    };
  }
}

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
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch embed widget config",
    };
  }
}
