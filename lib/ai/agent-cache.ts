import { Agent, type IAgent } from "../db/models/Agent";
import { connectToDatabase } from "../db/connect";


const cache = new Map<string, IAgent>();


export async function getAgentConfig(workspaceId: string): Promise<IAgent | null> {
  const cached = cache.get(workspaceId);

  console.log(workspaceId)
  if (cached) return cached;

  await connectToDatabase();
  const agentConfig = await Agent.findOne({ workspaceId }).lean<IAgent>();
  console.log(agentConfig)

  if (agentConfig) {
    cache.set(workspaceId, agentConfig);
  }

  return agentConfig;
}

export function invalidateAgentCache(workspaceId: string): void {
  cache.delete(workspaceId);
}
