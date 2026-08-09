"use server";
import { updateTag, revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { Workspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { createVisitorTicket, createAgentToken } from "@/lib/chat/socket-auth";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import * as routingService from "@/lib/chat/routing-service";
import { getCompiledGraph } from "@/lib/ai/graph";
import { getAgentConfig } from "@/lib/ai/agent-cache";
import type { SystemEventType } from "@/lib/db/models/Message";
import { HumanMessage } from "@langchain/core/messages";
import mongoose from "mongoose";
// ---------------------------------------------------------------------------
// Serialized message shape returned to the widget
// ---------------------------------------------------------------------------
interface SerializedMessage {
  _id: string;
  conversationId: string;
  workspaceId: string;
  senderType: "visitor" | "ai" | "agent" | "system";
  senderUserId?: string;
  content: string;
  sequence: number;
  clientMessageId?: string;
  systemEventType?: SystemEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

function serializeMsg(m: any): SerializedMessage {
  return {
    _id: m._id.toString(),
    conversationId: m.conversationId.toString(),
    workspaceId: m.workspaceId.toString(),
    senderType: m.senderType,
    senderUserId: m.senderUserId?.toString(),
    content: m.content,
    sequence: m.sequence || 0,
    clientMessageId: m.clientMessageId,
    systemEventType: m.systemEventType,
    metadata: m.metadata
      ? {
        ...(typeof m.metadata.toJSON === "function" ? m.metadata.toJSON() : m.metadata),
        actorUserId: m.metadata.actorUserId?.toString(),
        assignedAgentUserId: m.metadata.assignedAgentUserId?.toString(),
      }
      : undefined,
    createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}


export async function getChatHistory(sessionId: string, workspaceId?: string) {
  try {
    await connectToDatabase();
    const workspace = workspaceId
      ? await Workspace.findOne({ workspaceId })
      : null;
    const conversation = await Conversation.findOne({
      visitorId: sessionId,
      ...(workspace ? { workspaceId: workspace._id } : {}),
    });
    if (!conversation)
      return {
        success: true,
        messages: [],
        status: "ai" as const,
        conversationId: null,
      };

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ sequence: 1 })
      .lean();

    return {
      success: true,
      messages: messages.map(serializeMsg),
      status: conversation.status,
      conversationId: conversation._id.toString(),
    };
  } catch (error) {
    console.error("Failed to load chat history", error);
    return {
      success: false,
      error: "Failed to load chat history",
      messages: [],
      status: "ai" as const,
      conversationId: null,
    };
  }
}


// 1. Find or create conversation
// 2. Save visitor message
// 3. Run LangGraph (checkpoint remembers history)
// 4. Save AI response
// 5. If LLM escalated → return escalation info
// 6. Notify dashboard
export async function sendMessageToAi(params: {
  sessionId: string;
  workspaceId: string;
  content: string;
  clientMessageId: string;
  visitor?: { name?: string; email?: string; currentPage?: string };
}) {
  try {
    await connectToDatabase();

    const workspace = await Workspace.findOne({
      workspaceId: params.workspaceId,
    });
    if (!workspace) return { ok: false, error: "Workspace not found" };

    // Find or create conversation
    let conversation = await Conversation.findOne({
      visitorId: params.sessionId,
      workspaceId: workspace._id,
    });

    if (!conversation) {
      // Atomic increment visitor number
      const updated = await Workspace.findByIdAndUpdate(
        workspace._id,
        { $inc: { nextVisitorNumber: 1 } },
        { returnDocument: "after" }
      );
      const visitorNum = updated?.nextVisitorNumber ?? 1;

      conversation = await Conversation.create({
        workspaceId: workspace._id,
        visitorId: params.sessionId,
        visitorNumber: visitorNum,
        status: "ai",
        visitor: {
          name:
            params.visitor?.name?.trim() || `Visitor ${visitorNum}`,
          email: params.visitor?.email?.trim() || "",
          currentPage: params.visitor?.currentPage || "/",
        },
        routingVersion: 0,
        lastSequence: 0,
      });
    } else if (
      params.visitor?.name ||
      params.visitor?.email ||
      params.visitor?.currentPage
    ) {
      // Update visitor info if provided
      const updates: Record<string, string> = {};
      if (params.visitor.name) updates["visitor.name"] = params.visitor.name.trim();
      if (params.visitor.email) updates["visitor.email"] = params.visitor.email.trim();
      if (params.visitor.currentPage) updates["visitor.currentPage"] = params.visitor.currentPage;
      await Conversation.updateOne({ _id: conversation._id }, { $set: updates });
    }

    // Guard: only process if still in AI mode
    if (conversation.status !== "ai") {
      return { ok: false, error: "Conversation is not in AI mode" };
    }

    const conversationId = conversation._id.toString();
    const workspaceOid = workspace._id.toString();

    // Save visitor message
    const visitorMsg = await routingService.createMessage({
      conversationId,
      workspaceId: workspaceOid,
      senderType: "visitor",
      content: params.content,
      clientMessageId: params.clientMessageId,
    });

    // Run LangGraph
    const agentConfig = await getAgentConfig(workspaceOid);
    if (!agentConfig) {
      return { ok: false, error: "Failed to load agent configuration" };
    }

    const preVersion = conversation.routingVersion;
    const graph = await getCompiledGraph();
    const config = {
      configurable: {
        thread_id: params.sessionId,
        workspaceId: workspaceOid,
        conversationId,
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
          name: conversation.visitor?.name || "Visitor",
          email: conversation.visitor?.email || "",
        },
      },
    };

    let runTokensUsed = 0;
    let runApiCalls = 0;

    (config as any).callbacks = [
      {
        handleLLMEnd(output: any) {
          runApiCalls += 1;
          const tokenUsage = output.llmOutput?.estimatedTokenUsage || output.llmOutput?.tokenUsage;
          if (tokenUsage) {
            runTokensUsed += (tokenUsage.totalTokens || 0);
          }
        },
      },
    ];

    let result;
    try {
      result = await graph.invoke(
        { messages: [new HumanMessage(params.content)] },
        config
      );
    } catch (error: any) {
      console.error("LangGraph error (possibly hit recursion limit):", error);
      // If we hit the limit, just return a graceful fallback message
      const fallbackMsg = await routingService.createMessage({
        conversationId,
        workspaceId: workspaceOid,
        senderType: "ai",
        content: "I'm having trouble processing that right now. Could you please rephrase?",
      });

      // Update workspace API credits even if we hit the limit
      if (runApiCalls > 0 || runTokensUsed > 0) {
        await Workspace.findByIdAndUpdate(workspaceOid, {
          $inc: { apiCallsUsed: runApiCalls, tokensUsed: runTokensUsed },
        }).catch(console.error);
      }

      return {
        ok: true,
        visitorMessage: serializeMsg(visitorMsg),
        aiMessage: serializeMsg(fallbackMsg),
        escalated: false,
        newStatus: conversation.status,
        systemMessages: [],
        conversationId,
      };
    }

    // Save usage metrics to Workspace
    if (runApiCalls > 0 || runTokensUsed > 0) {
      await Workspace.findByIdAndUpdate(workspace._id, {
        $inc: { apiCallsUsed: runApiCalls, tokensUsed: runTokensUsed },
      });
    }



    // Extract AI response text
    const lastMessage = result.messages[result.messages.length - 1];
    const aiText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : "I encountered an error. Please try again.";

    // Save AI message
    const aiMsg = await routingService.createMessage({
      conversationId,
      workspaceId: workspaceOid,
      senderType: "ai",
      content: aiText,
    });

    
    const lastHumanIdx = result.messages.findLastIndex((m: any) => m._getType() === "human");
    const currentTurnMessages = result.messages.slice(lastHumanIdx + 1);

    const escalateCall = currentTurnMessages
      .flatMap((m: any) => m.tool_calls || [])
      .find((tc: any) => tc.name === "escalate_to_human");

    const escalated = !!escalateCall;

    if (escalated) {
      const reason = escalateCall.args?.reason || "User requested human handoff.";

      
      const handoffResult = await routingService.requestHumanHandoff({
        conversationId,
        reason,
      });

      return {
        ok: true,
        visitorMessage: serializeMsg(visitorMsg),
        aiMessage: serializeMsg(aiMsg),
        escalated: true,
        newStatus: "waiting",
        systemMessages: handoffResult ? [serializeMsg(handoffResult.systemMessage)] : [],
        conversationId,
      };
    }

    return {
      ok: true,
      visitorMessage: serializeMsg(visitorMsg),
      aiMessage: serializeMsg(aiMsg),
      escalated: false,
      conversationId,
    };
  } catch (error) {
    console.error("[sendMessageToAi] Error:", error);
    return { ok: false, error: "Failed to process message" };
  }
}

// ---------------------------------------------------------------------------
// getVisitorSocketTicket — for human/waiting mode socket connection
// ---------------------------------------------------------------------------
export async function getVisitorSocketTicket(
  sessionId: string,
  workspaceId: string
) {
  try {
    if (!sessionId || !workspaceId) {
      return { error: "sessionId and workspaceId are required" };
    }

    await connectToDatabase();

    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) return { error: "Workspace not found" };

    // Conversation must already exist (created by sendMessageToAi)
    const conversation = await Conversation.findOne({
      visitorId: sessionId,
      workspaceId: workspace._id,
    });
    if (!conversation) return { error: "Conversation not found" };

    const ticket = createVisitorTicket({
      conversationId: conversation._id.toString(),
      workspaceId: workspace._id.toString(),
      visitorId: sessionId,
    });

    return {
      ticket,
      conversationId: conversation._id.toString(),
    };
  } catch (error) {
    console.error("[Action] getVisitorSocketTicket error:", error);
    return { error: "Failed to create socket ticket" };
  }
}

// ---------------------------------------------------------------------------
// getAgentSocketToken — dashboard agent socket auth
// ---------------------------------------------------------------------------
export async function getAgentSocketToken() {
  try {
    const ctx = await resolveUserWorkspace();
    if (!ctx) return { error: "Not authenticated" };

    await connectToDatabase();
    const member = await WorkspaceMember.findOne({
      userId: ctx.userId,
      workspaceId: ctx.workspace._id,
    });

    if (!member) return { error: "No workspace membership" };

    const token = createAgentToken({
      userId: ctx.userId,
      workspaceId: ctx.workspace._id.toString(),
      role: member.role,
    });

    return {
      token,
      workspaceId: ctx.workspace._id.toString(),
    };
  } catch (error) {
    console.error("[Action] getAgentSocketToken error:", error);
    return { error: "Failed to create agent token" };
  }
}

// ---------------------------------------------------------------------------
// continueChat — reopen a resolved conversation back to AI mode
// ---------------------------------------------------------------------------
export async function continueChat(conversationId: string) {
  try {
    await connectToDatabase();
    const convo = await Conversation.findOneAndUpdate(
      { _id: conversationId, status: "resolved" },
      {
        $set: { status: "ai", routingChangedAt: new Date() },
        $unset: { assignedAgentUserId: 1 },
        $inc: { routingVersion: 1 },
      },
      { returnDocument: "after" }
    );

    if (!convo) return { ok: false, error: "Conversation not found or not resolved" };

    return { ok: true, status: convo.status };
  } catch (error) {
    console.error("[continueChat] Error:", error);
    return { ok: false, error: "Failed to continue chat" };
  }
}

// ---------------------------------------------------------------------------
// startNewChat — delete conversation, messages, and LangGraph checkpoint
// ---------------------------------------------------------------------------
export async function startNewChat(sessionId: string, workspaceId: string) {
  try {
    await connectToDatabase();

    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) return { ok: false, error: "Workspace not found" };

    const conversation = await Conversation.findOne({
      visitorId: sessionId,
      workspaceId: workspace._id,
    });

    if (conversation) {
      // Delete all messages
      await Message.deleteMany({ conversationId: conversation._id });

      // Delete LangGraph checkpoint data (thread_id = sessionId)
      const db = mongoose.connection.db;
      if (db) {
        await db
          .collection("checkpoints")
          .deleteMany({ thread_id: sessionId });
        await db
          .collection("checkpoint_writes")
          .deleteMany({ thread_id: sessionId });
      }

      // Delete conversation
      await Conversation.deleteOne({ _id: conversation._id });
    }

    return { ok: true };
  } catch (error) {
    console.error("[startNewChat] Error:", error);
    return { ok: false, error: "Failed to start new chat" };
  }
}
