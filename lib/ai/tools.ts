import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Conversation } from "../db/models/Conversation";
import { searchWorkspaceVectorsWithScores } from "./vector-store";
import type { HumanFallbackBehavior } from "./agent-instructions";

const MAX_CONTEXT_CHARS_PER_RESULT = 1_200;

function getConfidenceConfig(config: { configurable?: Record<string, unknown> } | undefined) {
  const agentPayload = config?.configurable?.agentPayload as
    | {
        confidenceThreshold?: number;
        humanFallbackBehavior?: HumanFallbackBehavior;
      }
    | undefined;

  const confidenceThreshold = agentPayload?.confidenceThreshold;

  return {
    threshold:
      typeof confidenceThreshold === "number" &&
      Number.isFinite(confidenceThreshold) &&
      confidenceThreshold >= 0 &&
      confidenceThreshold <= 1
        ? confidenceThreshold
        : 0.65,
    fallbackBehavior: agentPayload?.humanFallbackBehavior === "cannot" ? "cannot" : "escalate",
  };
}

export const captureUserDetailsTool = new DynamicStructuredTool({
  name: "capture_user_details",
  description: "Use this tool immediately after the user provides their name and email address to save it to their profile.",
  schema: z.object({
    name: z.string().describe("The user's full name"),
    email: z.string().describe("The user's email address"),
  }),
  func: async ({ name, email }, runManager, config) => {
    const sessionId = config?.configurable?.thread_id;
    if (!sessionId) return "Error: Missing session ID";

    try {
      const convo = await Conversation.findOne({ visitorId: sessionId });
      if (convo) {
        convo.visitor.name = name;
        convo.visitor.email = email;
        await convo.save();
        return `Successfully updated user details to Name: ${name}, Email: ${email}`;
      }
      return "Conversation not found, but details received.";
    } catch (e) {
      return "Failed to save details.";
    }
  },
});

export const escalateToHumanTool = new DynamicStructuredTool({
  name: "escalate_to_human",
  description: "Use this tool to route the conversation to a human support agent when you cannot resolve the issue or the user demands a human. Only use if the user provides a valid reason.",
  schema: z.object({
    reason: z.string().describe("The specific reason the user needs a human agent"),
  }),
  func: async ({ reason }, runManager, config) => {
    const sessionId = config?.configurable?.thread_id;
    if (!sessionId) return "Error: Missing session ID";

    try {
      const convo = await Conversation.findOne({ visitorId: sessionId });
      if (convo) {
        convo.status = "waiting";
        convo.handoffReason = reason;
        await convo.save();
        return `Escalated to human support successfully. Reason: ${reason}. Please inform the user that a human agent has been notified and will be with them shortly.`;
      }
      return "Failed to escalate. Conversation not found.";
    } catch (e) {
      return "Error during escalation.";
    }
  },
});

export const searchKnowledgeBaseTool = new DynamicStructuredTool({
  name: "search_knowledge_base",
  description: "Search the company's knowledge base for answers to user questions (e.g., policies, refund rules, features).",
  schema: z.object({
    query: z.string().describe("The search query to look up in the knowledge base"),
  }),
  func: async ({ query }, runManager, config) => {
    const workspaceId = config?.configurable?.workspaceId;
    if (!workspaceId) return "Error: Missing workspace ID in config";

    const { threshold, fallbackBehavior } = getConfidenceConfig(config);

    try {
      const matches = await searchWorkspaceVectorsWithScores(workspaceId, query, 4);
      const confidence = matches[0]?.[1] ?? 0;

      if (matches.length === 0 || confidence < threshold) {
        return JSON.stringify({
          source: "knowledge_base",
          retrieval: {
            status: matches.length === 0 ? "no_results" : "below_threshold",
            confidence: Number(confidence.toFixed(4)),
            threshold,
          },
          requiredAction:
            fallbackBehavior === "escalate"
              ? "Do not answer from the knowledge base. Call escalate_to_human now."
              : "Do not answer from the knowledge base. State that the answer cannot be verified from the available information.",
        });
      }

      return JSON.stringify({
        source: "knowledge_base",
        retrieval: {
          status: "qualified",
          confidence: Number(confidence.toFixed(4)),
          threshold,
        },
        results: matches.map(([document, score]) => ({
          title: String(document.metadata.title || "Knowledge base"),
          sourceUrl: document.metadata.sourceUrl ? String(document.metadata.sourceUrl) : undefined,
          confidence: Number(score.toFixed(4)),
          content: document.pageContent.slice(0, MAX_CONTEXT_CHARS_PER_RESULT),
        })),
      });
    } catch (error) {
      console.error("Knowledge base search failed:", error);
      return JSON.stringify({
        source: "knowledge_base",
        retrieval: { status: "unavailable", confidence: 0, threshold },
        requiredAction:
          fallbackBehavior === "escalate"
            ? "Do not guess. Call escalate_to_human because the knowledge base is unavailable."
            : "Do not guess. State that the answer cannot be verified right now.",
      });
    }
  },
});

export const allTools = [searchKnowledgeBaseTool, captureUserDetailsTool, escalateToHumanTool];
