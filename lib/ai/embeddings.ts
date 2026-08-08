import { OpenAIEmbeddings } from "@langchain/openai";

export const embeddings = new OpenAIEmbeddings({
  model: "gemini-embedding-001", 
  apiKey: process.env.GOOGLE_API_KEY!,
  dimensions: 1536,
  batchSize: 100, // Google API limits batch embedding to 100 requests at a time
  configuration: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  }
});
