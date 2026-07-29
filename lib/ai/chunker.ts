import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * Splits raw LangChain Documents into smaller chunks for embedding.
 * Uses the same config as the previous support_agent project.
 */
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

export async function createChunks(rawDocs: Document[]): Promise<Document[]> {
  return splitter.splitDocuments(rawDocs);
}
