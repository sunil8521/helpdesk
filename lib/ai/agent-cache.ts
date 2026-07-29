import { Agent, type IAgent } from "../db/models/Agent";
import { connectToDatabase } from "../db/connect";

/**
 * In-memory agent config cache.
 * Keyed by workspaceId (the ObjectId string).
 * Agent settings rarely change — only when admin edits them in the dashboard.
 * We invalidate the specific key when that happens.
 */
const cache = new Map<string, IAgent>();

/**
 * Get agent config for a workspace, hitting MongoDB only on cache miss.
 */
export async function getAgentConfig(workspaceId: string): Promise<IAgent | null> {
  const cached = cache.get(workspaceId);
  if (cached) return cached;

  await connectToDatabase();
  const agentConfig = await Agent.findOne({ workspaceId }).lean<IAgent>();
  if (agentConfig) {
    cache.set(workspaceId, agentConfig);
  }

  return agentConfig;
}

/**
 * Call this whenever admin updates agent settings (from settings.ts / onboarding.ts).
 * Forces the next `getAgentConfig()` call to re-fetch from MongoDB.
 */
export function invalidateAgentCache(workspaceId: string): void {
  cache.delete(workspaceId);
}
