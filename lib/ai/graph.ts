import { START, StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { SystemMessage, BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { allTools } from "./tools";
import { initCheckpointer } from "./checkpoint";
import { getLlm } from "./llm";
import { buildAgentSystemPrompt, type AgentPromptConfig } from "./agent-instructions";


export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage | BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
});


const toolNode = new ToolNode(allTools);

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

  const llm = getLlm(agentPayload.aiModel, agentPayload.temperature); //to get LLM
  const allowedTools = agentPayload.humanFallbackBehavior === "cannot"
    ? allTools.filter(t => t.name !== "escalate_to_human")
    : allTools;
  const llmWithTools = llm.bindTools(allowedTools);

  const visitorName = visitorSnapshot?.name || "Anonymous";
  const visitorEmail = visitorSnapshot?.email || "Unknown";

  const dynamicSystemPrompt = new SystemMessage(
    buildAgentSystemPrompt({
      agent: agentPayload,
      visitor: { name: visitorName, email: visitorEmail },
    })
  );

  const response = await llmWithTools.invoke([dynamicSystemPrompt, ...state.messages], config);
  return { messages: [response] };
}

const workflow = new StateGraph(GraphState)
  .addNode("chatBot", chatBot)
  .addNode("tools", toolNode)
  .addEdge(START, "chatBot")
  .addConditionalEdges("chatBot", toolsCondition)
  .addEdge("tools", "chatBot");

let compiledGraph: ReturnType<typeof workflow.compile> | null = null;

export async function getCompiledGraph() {
  if (!compiledGraph) {
    const checkpointer = await initCheckpointer();
    compiledGraph = workflow.compile({ checkpointer });
  }
  return compiledGraph;
}
