"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { inngest } from "@/lib/inngest/client";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { updateTag } from "next/cache";

/**
 * Helper to queue a knowledge source for processing
 */
async function queueKnowledgeSource(sourceId: string, workspaceId: string, type: string) {
  try {
    if (type === "url") {
      await inngest.send({
        name: "knowledge/process-url",
        data: { sourceId, workspaceId },
      });
    } else {
      await inngest.send({
        name: "knowledge/process-source",
        data: { sourceId, workspaceId },
      });
    }
    await KnowledgeSource.findByIdAndUpdate(sourceId, { status: "queued", errorMessage: null });
    return { success: true };
  } catch (err: any) {
    console.error("Inngest queue error:", err);
    await KnowledgeSource.findByIdAndUpdate(sourceId, { status: "unable_to_queue", errorMessage: err.message });
    return { error: err.message || "Failed to queue document" };
  }
}

/**
 * Unified Knowledge Source Creator
 * Supports text, url, and file types.
 */
export async function createKnowledgeSourceAction(data: {
  type: "text" | "file" | "url";
  title: string;
  rawText?: string;
  url?: string;
  file?: {
    r2Key: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
}) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role === "agent") return { error: "Only admins and owners can modify documents" };

  await connectToDatabase();

  const sourceData: any = {
    workspaceId: ctx.workspace._id,
    sourceType: data.type,
    title: data.title,
    uploaderUserId: ctx.userId,
    status: "uploaded",
  };

  if (data.type === "text" && data.rawText) {
    sourceData.rawText = data.rawText;
  } else if (data.type === "url" && data.url) {
    sourceData.webUrl = data.url;
  } else if (data.type === "file" && data.file) {
    sourceData.r2Key = data.file.r2Key;
    sourceData.fileUrl = data.file.fileUrl;
    sourceData.fileSize = data.file.fileSize;
    sourceData.mimeType = data.file.mimeType;
  }

  let source;
  try {
    source = await KnowledgeSource.create(sourceData);
  } catch (err: any) {
    console.error("DB Upload Error:", err);
    return { error: "Failed to upload document to database" };
  }

  const queueResult = await queueKnowledgeSource(source._id.toString(), ctx.workspace._id.toString(), data.type);

  // NEXT 16 API: Forces an immediate, synchronous update for the dashboard
  updateTag(`knowledge-${ctx.workspace._id.toString()}`);

  if (queueResult.error) {
    return { error: queueResult.error };
  }

  return { success: true, sourceId: source._id.toString() };
}

/**
 * Retry Knowledge Source Queue
 * Retries sending the document to the background queue.
 */
export async function retryKnowledgeQueueAction(sourceId: string) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  await connectToDatabase();
  const source = await KnowledgeSource.findById(sourceId);
  if (!source) return { error: "Source not found" };

  // Verify workspace ownership
  if (source.workspaceId.toString() !== ctx.workspace._id.toString()) {
    return { error: "Unauthorized" };
  }

  if (!["unable_to_queue", "failed", "uploaded"].includes(source.status)) {
    return { error: "Document is not in a retryable state." };
  }

  const queueResult = await queueKnowledgeSource(source._id.toString(), ctx.workspace._id.toString(), source.sourceType);

  updateTag(`knowledge-${ctx.workspace._id.toString()}`);
  
  if (queueResult.error) {
    return { error: queueResult.error };
  }
  return { success: true };
}

/**
 * Checks the status of an array of knowledge sources.
 * Used for real-time UI polling in both onboarding and dashboard.
 */
export async function checkKnowledgeSourceStatusAction(sourceIds: string[]) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  await connectToDatabase();
  const sources = await KnowledgeSource.find({
    _id: { $in: sourceIds },
    workspaceId: ctx.workspace._id,
  }).lean();

  return {
    success: true,
    sources: sources.map((s) => ({
      id: s._id.toString(),
      status: s.status,
      errorMessage: s.errorMessage,
    })),
  };
}

/**
 * Delete a knowledge source — removes from R2, vectors, and MongoDB.
 */
export async function deleteKnowledgeSourceAction(sourceId: string) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };
  if (ctx.role === "agent") return { error: "Only admins and owners can modify documents" };

  await connectToDatabase();
  const source = await KnowledgeSource.findById(sourceId);
  if (!source) return { error: "Source not found" };

  // Verify workspace ownership
  if (source.workspaceId.toString() !== ctx.workspace._id.toString()) {
    return { error: "Unauthorized" };
  }

  // Delete file from R2
  if (source.r2Key) {
    try {
      const { deleteFromR2 } = await import("@/lib/r2");
      await deleteFromR2(source.r2Key);
    } catch (e) {
      console.error("R2 delete failed:", e);
    }
  }

  // Delete vectors from MongoDB
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const collection = client.db("helpdesk").collection("vectors");
    // await collection.deleteMany({ "metadata.sourceId": sourceId });

    await collection.deleteMany({
      $or: [
        { sourceId: sourceId },
        { "metadata.sourceId": sourceId }
      ]
    });
  } catch (err) {
    console.error("Failed to delete vectors:", err);
  } finally {
    await client.close();
  }

  // Delete the record
  await KnowledgeSource.findByIdAndDelete(sourceId);

  // NEXT 16 API: Bust cache
  updateTag(`knowledge-${ctx.workspace._id.toString()}`);

  return { success: true };
}

/**
 * Retry a failed knowledge source.
 */
export async function retryKnowledgeSourceAction(sourceId: string) {
  const ctx = await resolveUserWorkspace();
  if (!ctx) return { error: "Unauthorized" };

  await connectToDatabase();
  const source = await KnowledgeSource.findById(sourceId);
  if (!source) return { error: "Source not found" };

  try {
    await inngest.send({
      name: "knowledge/retry",
      data: {
        sourceId,
        workspaceId: ctx.workspaceId,
      },
    });
  } catch (err: any) {
    console.error("Inngest retry error:", err);
    return { error: "Failed to queue retry job. Please ensure Inngest dev server is running." };
  }

  // NEXT 16 API: Bust cache
  updateTag(`knowledge-${ctx.workspace._id.toString()}`);

  return { success: true };
}
