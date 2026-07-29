"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { getCompiledGraph } from "@/lib/ai/graph";
import { getAgentConfig } from "@/lib/ai/agent-cache";
import { HumanMessage } from "@langchain/core/messages";

interface ChatInput {
  sessionId: string;
  workspaceId: string;
  userMessage: string;
  ssoEmail?: string;
  ssoName?: string;
}

export async function handleWidgetMessage({ sessionId, workspaceId, userMessage, ssoEmail, ssoName }: ChatInput) {
  try {
    await connectToDatabase();

    // 1. Fetch agent config from in-memory cache (hits MongoDB only on first call per workspace)
    const agentConfig = await getAgentConfig(workspaceId);
    if (!agentConfig) {
      return { success: false, error: "Agent configuration not found for this workspace." };
    }

    // 2. Find or create the conversation session
    let conversation = await Conversation.findOne({ visitorId: sessionId });
    if (!conversation) {
      conversation = await Conversation.create({
        workspaceId,
        visitorId: sessionId,
        status: "ai",
        visitor: {
          name: ssoName || "Anonymous Visitor",
          email: ssoEmail || "",
        },
      });
    } else {
      // If the user was anonymous but later logged in on the host site, we can upgrade their profile here
      if (ssoEmail && conversation.visitor.email !== ssoEmail) {
        conversation.visitor.email = ssoEmail;
        conversation.visitor.name = ssoName || conversation.visitor.name;
        await conversation.save();
      }
    }

    // Check if a human agent has taken over. If so, do not run the AI.
    if (conversation.status === "human" || conversation.status === "waiting") {
      // Just save the user message to DB for the human to read
      const storedUserMsg = await Message.create({
        conversationId: conversation._id,
        workspaceId,
        senderType: "visitor",
        content: userMessage,
      });
      return {
        success: true,
        userMessage: JSON.parse(JSON.stringify(storedUserMsg)),
        aiMessage: null, // No AI response
        status: conversation.status
      };
    }

    // 3. Commit User Message directly to MongoDB
    const storedUserMsg = await Message.create({
      conversationId: conversation._id,
      workspaceId,
      senderType: "visitor",
      content: userMessage,
    });

    // 4. Fire Server-to-Server LLM API Request via LangGraph
    const graph = await getCompiledGraph();
    const config = {
      configurable: {
        thread_id: sessionId, // Checkpointer auto-loads memory for this user
        workspaceId,
        agentPayload: {
          name: agentConfig.name,
          role: agentConfig.role,
          description: agentConfig.description,
          tone: agentConfig.tone,
          aiModel: agentConfig.aiModel,
          temperature: agentConfig.temperature,
          responseLength: agentConfig.responseLength,
          confidenceThreshold: agentConfig.confidenceThreshold,
          humanFallbackBehavior: agentConfig.humanFallbackBehavior,
        },
        visitorSnapshot: {
          name: conversation.visitor?.name || "Anonymous",
          email: conversation.visitor?.email || "",
        },
      },
    };

    const result = await graph.invoke(
      { messages: [new HumanMessage(userMessage)] },
      config
    );

    // LangGraph appends the new messages. The last message is the AI's response.
    const lastMessage = result.messages[result.messages.length - 1];
    const aiResponseText = typeof lastMessage.content === "string" ? lastMessage.content : "Error generating response.";

    // 5. Commit AI generated reply directly to MongoDB
    const storedAiMsg = await Message.create({
      conversationId: conversation._id,
      workspaceId,
      senderType: "ai",
      content: aiResponseText,
    });

    return {
      success: true,
      userMessage: JSON.parse(JSON.stringify(storedUserMsg)),
      aiMessage: JSON.parse(JSON.stringify(storedAiMsg)),
      status: "ai"
    };
  } catch (error: any) {
    console.error("Widget LLM Action Error:", error);
    return { success: false, error: "Failed to process chat pipeline" };
  }
}

export async function getChatHistory(sessionId: string) {
  try {
    await connectToDatabase();
    const conversation = await Conversation.findOne({ visitorId: sessionId });
    if (!conversation) return { success: true, messages: [], status: "ai" };

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    return {
      success: true,
      messages: JSON.parse(JSON.stringify(messages)),
      status: conversation.status
    };
  } catch (error) {
    console.error("Failed to load chat history", error);
    return { success: false, error: "Failed to load chat history" };
  }
}
