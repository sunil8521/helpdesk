import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Workspace, IWorkspace } from "@/lib/db/models/Workspace";
import { Agent, IAgent } from "@/lib/db/models/Agent";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";

// Fetch workspace and AI agent settings for the logged-in user
export async function getWorkspaceAndAgentSettings() {
  const ctx = await resolveUserWorkspace();
  if (!ctx) throw new Error("Unauthorized");
  const data = await fetchWorkspaceAndAgentCached(ctx.workspace._id.toString());
  return { ...data, role: ctx.role };
}

// Cached query to fetch workspace and agent details from MongoDB
async function fetchWorkspaceAndAgentCached(workspaceId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`settings-${workspaceId}`);

  await connectToDatabase();

  const [workspace, agent] = await Promise.all([
    Workspace.findById(workspaceId).lean<IWorkspace>(),
    Agent.findOne({ workspaceId }).lean<IAgent>(),
  ]);

  if (!workspace) throw new Error("Workspace not found");
  if (!agent) throw new Error("Agent not found");

  return {
    workspace: {
      id: workspace._id.toString(),
      workspaceId: workspace.workspaceId,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      tokensUsed: workspace.tokensUsed || 0,
      apiCallsUsed: workspace.apiCallsUsed || 0,
    },
    agent: {
      id: agent._id.toString(),
      name: agent.name,
      role: agent.role,
      description: agent.description,
      tone: agent.tone,
      responseLength: agent.responseLength,
      aiModel: agent.aiModel,
      temperature: agent.temperature,
      confidenceThreshold: agent.confidenceThreshold,
      humanFallbackBehavior: agent.humanFallbackBehavior,
    },
  };
}
