import { inngest } from "./client";
import { connectToDatabase } from "@/lib/db/connect";
import { KnowledgeSource } from "@/lib/db/models/KnowledgeSource";
import {
  processKnowledgeSource,
  uploadScrapedContentToR2,
} from "@/lib/ai/process-knowledge";
import { scrapeUrlWithScrapeDo } from "@/lib/scraper";

/**
 * Process URL knowledge source.
 * Scrapes the URL via Scrape.do, uploads markdown to R2,
 * and then embeds it directly inside a single reliable pipeline.
 */
export const processUrlKnowledge = inngest.createFunction(
  {
    id: "process-url-knowledge",
    retries: 2,
    triggers: [{ event: "knowledge/process-url" }],
  },
  async ({ event, step }) => {
    const { sourceId, workspaceId } = event.data;

    await connectToDatabase();
    const source = await KnowledgeSource.findById(sourceId);
    if (!source || source.sourceType !== "url" || !source.webUrl) {
      return { success: false, error: "Invalid URL source" };
    }

    // Step 1: Scrape the URL via Scrape.do
    const scraped = await step.run("scrape-url", async () => {
      return scrapeUrlWithScrapeDo(source.webUrl!);
    });

    // Step 2: Upload scraped markdown to R2 and update MongoDB
    await step.run("upload-to-r2", async () => {
      await uploadScrapedContentToR2({
        sourceId,
        workspaceId,
        text: scraped.text,
        title: scraped.title,
      });
    });

    // Step 3: Embed and store vectors
    const result = await step.run("embed-and-store", async () => {
      return processKnowledgeSource(sourceId, workspaceId);
    });

    return result;
  }
);

/**
 * Process a knowledge source (text, file, or url).
 * Triggered by the final onboarding submission.
 * Extracts, chunks, embeds, and stores in vector DB.
 */
export const processSourceKnowledge = inngest.createFunction(
  {
    id: "process-source-knowledge",
    retries: 2,
    triggers: [{ event: "knowledge/process-source" }],
  },
  async ({ event, step }) => {
    const { sourceId, workspaceId } = event.data;

    const result = await step.run("embed-and-store", async () => {
      return processKnowledgeSource(sourceId, workspaceId);
    });

    return result;
  }
);

/**
 * Retry a failed knowledge source.
 * Re-runs the appropriate pipeline based on sourceType.
 */
export const retryKnowledgeSource = inngest.createFunction(
  {
    id: "retry-knowledge-source",
    retries: 1,
    triggers: [{ event: "knowledge/retry" }],
  },
  async ({ event, step }) => {
    const { sourceId, workspaceId } = event.data;

    await connectToDatabase();
    const source = await KnowledgeSource.findById(sourceId);
    if (!source) {
      throw new Error(`KnowledgeSource ${sourceId} not found`);
    }

    // Reset status to processing
    await KnowledgeSource.findByIdAndUpdate(sourceId, {
      status: "processing",
      errorMessage: "",
    });

    if (source.sourceType === "url" && source.webUrl && !source.r2Key) {
      // URL hasn't been scraped yet, scrape first
      const scraped = await step.run("scrape-url", async () => {
        return scrapeUrlWithScrapeDo(source.webUrl!);
      });

      await step.run("upload-to-r2", async () => {
        await uploadScrapedContentToR2({
          sourceId,
          workspaceId,
          text: scraped.text,
          title: scraped.title,
        });
      });
    }

    // Process (chunk + embed) if ready
    const result = await step.run("embed-and-store", async () => {
      return processKnowledgeSource(sourceId, workspaceId);
    });

    return result;
  }
);

/** All Inngest functions to register with the serve handler */
export const inngestFunctions = [
  processUrlKnowledge,
  processSourceKnowledge,
  retryKnowledgeSource,
];
