"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { inngest } from "@/lib/inngest/client";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { updateTag } from "next/cache";

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

  await connectToDatabase();

  const sourceData: any = {
    workspaceId: ctx.workspace._id,
    sourceType: data.type,
    title: data.title,
    uploaderUserId: ctx.userId,
    status: data.type === "url" ? "pending" : "uploaded",
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

  const source = await KnowledgeSource.create(sourceData);

  if (data.type === "url") {
    await inngest.send({
      name: "knowledge/process-url",
      data: {
        sourceId: source._id.toString(),
        workspaceId: ctx.workspaceId,
      },
    });
  } else {
    await inngest.send({
      name: "knowledge/process-source",
      data: {
        sourceId: source._id.toString(),
        workspaceId: ctx.workspaceId,
      },
    });
  }

  // NEXT 16 API: Forces an immediate, synchronous update for the dashboard
  updateTag(`knowledge-${ctx.workspace._id.toString()}`);

  return { success: true, sourceId: source._id.toString() };
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
    await collection.deleteMany({ "metadata.sourceId": sourceId });
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

  await inngest.send({
    name: "knowledge/retry",
    data: {
      sourceId,
      workspaceId: ctx.workspaceId,
    },
  });

  // NEXT 16 API: Bust cache
  updateTag(`knowledge-${ctx.workspace._id.toString()}`);

  return { success: true };
}
