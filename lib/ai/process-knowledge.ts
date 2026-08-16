import { Document } from "@langchain/core/documents";
import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import { getVectorStore } from "./vector-store";
import { createChunks } from "./chunker";
import { r2Client, getR2PublicUrl } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFParse } from "pdf-parse";

// import pc from "picocolors";





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
        if (source.r2Key) {
          const r2Response = await r2Client.send(
            new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: source.r2Key,
            })
          );

          const buffer = await r2Response.Body?.transformToByteArray();
          if (!buffer) throw new Error("No data received from R2");

          const ext = source.r2Key.split('.').pop()?.toLowerCase();

          if (ext === "pdf" || source.mimeType === "application/pdf") {
            const parser = new PDFParse({
              data: new Uint8Array(buffer),
            });
            try {
              const { pages } = await parser.getText();
              rawText = pages.map((page: any) => page.text).join("\n");
            } finally {
              await parser.destroy();
            }
          }
          else if (ext === "docx" || source.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const blob = new Blob([buffer as any]);
            const loader = new DocxLoader(blob);
            const docs = await loader.load();
            rawText = docs.map(d => d.pageContent).join("\n");
          }
          else if (ext === "csv" || source.mimeType === "text/csv") {
            const blob = new Blob([buffer as any], { type: "text/csv" });
            const docs = await new CSVLoader(blob).load();
            rawText = docs.map(d => d.pageContent).join("\n");
          }
          else if (["md", "txt"].includes(ext || "") || source.mimeType?.startsWith("text/")) {
            rawText = Buffer.from(buffer).toString("utf-8");
          }
          // else {
          //   rawText = Buffer.from(buffer).toString("utf-8");
          // }
        }
      }
      console.log(rawText)
      if (!rawText.trim()) {
        throw new Error("No content found to process");
      }
    } catch (e: any) {
      // console.log(pc.red(e))
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

    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(indexedChunks);

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
