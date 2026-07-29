import { START, StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { SystemMessage, BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { allTools } from "./tools";
import { initCheckpointer } from "./checkpoint";
import { getLlm } from "./llm";
import { buildAgentSystemPrompt, type AgentPromptConfig } from "./agent-instructions";

// ---------------------------------------------------------------------------
// Graph State — only messages. Visitor data stays in MongoDB (source of truth).
// ---------------------------------------------------------------------------
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage | BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
});

// ---------------------------------------------------------------------------
// Tool Node (stateless, safe to share)
// ---------------------------------------------------------------------------
const toolNode = new ToolNode(allTools);

// ---------------------------------------------------------------------------
// chatBot Node — zero DB queries, zero LLM instantiation
// Reads everything it needs from config.configurable (injected by chat.ts)
// ---------------------------------------------------------------------------
async function chatBot(state: typeof GraphState.State, config: RunnableConfig) {
  const agentPayload = config.configurable?.agentPayload as (AgentPromptConfig & {
    aiModel: string;
    temperature: number;
  }) | undefined;

  const visitorSnapshot = config.configurable?.visitorSnapshot as {
    name: string;
    email: string;
  } | undefined;

  if (!agentPayload) {
    throw new Error("agentPayload is missing in config.configurable — chat.ts must provide it.");
  }

  // Singleton LLM — cached by model:temperature key
  const llm = getLlm(agentPayload.aiModel, agentPayload.temperature);
  const llmWithTools = llm.bindTools(allTools);

  const visitorName = visitorSnapshot?.name || "Anonymous";
  const visitorEmail = visitorSnapshot?.email || "Unknown";

  const dynamicSystemPrompt = new SystemMessage(
    buildAgentSystemPrompt({
      agent: agentPayload,
      visitor: { name: visitorName, email: visitorEmail },
    })
  );

  const response = await llmWithTools.invoke([dynamicSystemPrompt, ...state.messages]);
  return { messages: [response] };
}

// ---------------------------------------------------------------------------
// Build the workflow graph (module-level, built once)
// ---------------------------------------------------------------------------
const workflow = new StateGraph(GraphState)
  .addNode("chatBot", chatBot)
  .addNode("tools", toolNode)
  .addEdge(START, "chatBot")
  .addConditionalEdges("chatBot", toolsCondition)
  .addEdge("tools", "chatBot");

// ---------------------------------------------------------------------------
// Singleton compiled graph — compiled once per server process
// ---------------------------------------------------------------------------
let compiledGraph: ReturnType<typeof workflow.compile> | null = null;

export async function getCompiledGraph() {
  if (!compiledGraph) {
    const checkpointer = await initCheckpointer();
    compiledGraph = workflow.compile({ checkpointer });
  }
  return compiledGraph;
}
