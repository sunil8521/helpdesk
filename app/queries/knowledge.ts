import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";

// Fetch knowledge sources for current logged in workspace
export async function getKnowledgeSources() {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  return fetchKnowledgeSourcesCached(ctx.workspace._id.toString());
}

// Cached query for knowledge documents
async function fetchKnowledgeSourcesCached(workspaceId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`knowledge-${workspaceId}`);

  await connectToDatabase();
  const sources = await KnowledgeSource.find({ workspaceId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    sources: sources.map((s: any) => ({
      _id: s._id.toString(),
      sourceType: s.sourceType,
      title: s.title,
      webUrl: s.webUrl,
      fileUrl: s.fileUrl,
      status: s.status,
      chunksCount: s.chunksCount,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}
