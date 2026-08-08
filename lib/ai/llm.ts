import { ChatGoogle } from "@langchain/google";

/**
 * Singleton LLM factory.
 * Caches ChatGoogle instances by "model:temperature" key.
 * The Gemini SDK internally manages HTTP connections,
 * so re-using the same instance avoids redundant setup on every message.
 */
const llmCache = new Map<string, ChatGoogle>();

export function getLlm(model: string, temperature: number): ChatGoogle {
  const key = `${model}:${temperature}`;

  let llm = llmCache.get(key);
  if (!llm) {
    llm = new ChatGoogle({
      model,
      temperature,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    llmCache.set(key, llm);
  }

  return llm;
}
