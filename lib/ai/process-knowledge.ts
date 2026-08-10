import { Document } from "@langchain/core/documents";
import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { getVectorStore } from "./vector-store";
import { createChunks } from "./chunker";
import { r2Client, getR2PublicUrl } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";


const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;


export async function processKnowledgeSource(
  sourceId: string,
  workspaceId: string
) {
  await connectToDatabase();

  const source = await KnowledgeSource.findById(sourceId);
  if (!source) {
    throw new Error(`KnowledgeSource ${sourceId} not found`);
  }

  const emitProgress = async (status: "uploaded" | "queued" | "completed" | "failed" | "unable_to_queue", progress: number, error?: string, chunksCount?: number) => {
    try {
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;
      await fetch(`${SOCKET_URL}/api/internal/socket-emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: `workspace:${workspaceId}:team`,
          event: "knowledge:progress",
          payload: {
            sourceId,
            status,
            progress,
            errorMessage: error,
            chunksCount,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to emit socket progress:", e);
    }
  };

  try {
    await emitProgress("queued", 10);
    await KnowledgeSource.findByIdAndUpdate(sourceId, { progress: 10 });
    let rawText = "";

    try {
      if (source.sourceType === "text") {
        rawText = source.rawText || "";
      } else if (source.sourceType === "url" || source.sourceType === "file") {
        // For url and file sources, fetch from R2
        if (source.r2Key) {
          const r2Response = await r2Client.send(
            new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: source.r2Key,
            })
          );
          rawText = (await r2Response.Body?.transformToString("utf-8")) || "";
        }
      }
      if (!rawText.trim()) {
        throw new Error("No content found to process");
      }
    } catch (e: any) {
      throw new Error(`[parse error] ${e.message}`);
    }

    // Create LangChain Document with workspace metadata
    const rawDoc = new Document({
      pageContent: rawText,
      metadata: {
        workspaceId: workspaceId,
        sourceId: sourceId,
        title: source.title,
        sourceType: source.sourceType,
        sourceUrl: source.webUrl || source.fileUrl || "",
      },
    });

    let chunks;
    try {
      await emitProgress("queued", 50);
      await KnowledgeSource.findByIdAndUpdate(sourceId, { progress: 50 });
      // Split into chunks
      chunks = await createChunks([rawDoc]);
    } catch (e: any) {
      throw new Error(`[chunk error] ${e.message}`);
    }

    // Add chunk index to metadata
    const indexedChunks = chunks.map((chunk, idx) => {
      chunk.metadata = {
        ...chunk.metadata,
        chunkIndex: idx,
      };
      return chunk;
    });

    // Embed + store in MongoDB Atlas Vector Search
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(indexedChunks);

    // Update KnowledgeSource status
    await KnowledgeSource.findByIdAndUpdate(sourceId, {
      status: "completed",
      progress: 100,
      chunksCount: indexedChunks.length,
      errorMessage: "",
    });
    await emitProgress("completed", 100, undefined, indexedChunks.length);

    return { success: true, chunksCount: indexedChunks.length };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown processing error";
    console.error(`Knowledge processing failed for ${sourceId}:`, errorMessage);

    await KnowledgeSource.findByIdAndUpdate(sourceId, {
      status: "failed",
      errorMessage,
    });
    await emitProgress("failed", 0, errorMessage);

    return { success: false, error: errorMessage };
  }
}

/**
 * Upload scraped markdown to R2 and update the KnowledgeSource record.
 */
export async function uploadScrapedContentToR2(params: {
  sourceId: string;
  workspaceId: string;
  text: string;
  title: string;
}) {
  const textBuffer = Buffer.from(params.text, "utf-8");
  const filename = `crawled-${Date.now()}.md`;
  const r2Key = `helpdesk/knowledge/${params.workspaceId}/scrapes/${filename}`;

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: textBuffer,
      ContentType: "text/markdown",
    })
  );

  const fileUrl = getR2PublicUrl(r2Key);

  // Update MongoDB record with R2 details
  await KnowledgeSource.findByIdAndUpdate(params.sourceId, {
    title: params.title,
    fileUrl,
    r2Key,
    fileSize: textBuffer.length,
    mimeType: "text/markdown",
    status: "queued",
  });
}
