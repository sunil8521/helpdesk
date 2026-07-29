import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Singleton LLM factory.
 * Caches ChatGoogleGenerativeAI instances by "model:temperature" key.
 * The Gemini SDK internally manages HTTP connections,
 * so re-using the same instance avoids redundant setup on every message.
 */
const llmCache = new Map<string, ChatGoogleGenerativeAI>();

export function getLlm(model: string, temperature: number): ChatGoogleGenerativeAI {
  const key = `${model}:${temperature}`;

  let llm = llmCache.get(key);
  if (!llm) {
    llm = new ChatGoogleGenerativeAI({
      model,
      temperature,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    llmCache.set(key, llm);
  }

  return llm;
}
