import { MongoDBAtlasVectorSearch, type MongoDBAtlasVectorSearchLibArgs } from "@langchain/mongodb";
import type { Document } from "@langchain/core/documents";
import { MongoClient } from "mongodb";
import { embeddings } from "./embeddings";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "helpdesk";
const COLLECTION_NAME = "vectors";
const INDEX_NAME = "vector_index";

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient;
}


export async function getVectorStore() {
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

  return new MongoDBAtlasVectorSearch(embeddings, {
    // The app uses MongoDB v7 while LangChain currently types this option against v6.
    collection: collection as unknown as MongoDBAtlasVectorSearchLibArgs["collection"],
    indexName: INDEX_NAME,
    textKey: "text",
    embeddingKey: "embedding",
  });
}

/**
 * Search vectors scoped to a specific workspace.
 * Uses MongoDB Atlas pre-filter to ensure tenant isolation.
 */
export async function searchWorkspaceVectors(
  workspaceId: string,
  query: string,
  topK: number = 5
) {
  const matches = await searchWorkspaceVectorsWithScores(workspaceId, query, topK);
  return matches.map(([document]) => document);
}

/**
 * Search vectors with Atlas' native vectorSearchScore. This score is compared
 * directly to Agent.confidenceThreshold, which is stored on the same 0-1 scale.
 */
export async function searchWorkspaceVectorsWithScores(
  workspaceId: string,
  query: string,
  topK: number = 5
): Promise<Array<[Document, number]>> {
  const vectorStore = await getVectorStore();

  return vectorStore.similaritySearchWithScore(query, topK, {
    preFilter: {
      workspaceId,
    },
  });
}
