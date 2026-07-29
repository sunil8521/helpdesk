import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Shared Google text-embedding-004 instance.
 * 768 dimensions, free with Gemini API key.
 */
export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY!,
});
