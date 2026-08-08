import { Conversation, type IConversation } from "@/lib/db/models/Conversation";
import { Message, type IMessage } from "@/lib/db/models/Message";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";
import { emitRouteChangedEvent, emitListUpdateWithData } from "./socket-notify";

// ---------------------------------------------------------------------------
// Helper: get next sequence number for a conversation
// ---------------------------------------------------------------------------
async function nextSequence(conversationId: mongoose.Types.ObjectId): Promise<number> {
  const convo = await Conversation.findByIdAndUpdate(
    conversationId,
    { $inc: { lastSequence: 1 } },
    { returnDocument: "after" }
  );
  return convo?.lastSequence ?? 1;
}

// ---------------------------------------------------------------------------
// Create a regular message (visitor, ai, or agent)
// ---------------------------------------------------------------------------
export async function createMessage(params: {
  conversationId: string;
  workspaceId: string;
  senderType: "visitor" | "ai" | "agent";
  senderUserId?: string;
  content: string;
  clientMessageId?: string;
}): Promise<IMessage> {
  await connectToDatabase();

  const convOid = new mongoose.Types.ObjectId(params.conversationId);

  if (params.clientMessageId) {
    const existing = await Message.findOne({
      conversationId: convOid,
      clientMessageId: params.clientMessageId,
    });
    if (existing) return existing;
  }

  const seq = await nextSequence(convOid);

  try {
    const msg = await Message.create({
      conversationId: convOid,
      workspaceId: params.workspaceId,
      senderType: params.senderType,
      senderUserId: params.senderUserId || undefined,
      content: params.content,
      clientMessageId: params.clientMessageId || undefined,
      sequence: seq,
    });

    return msg;
  } catch (error) {
    const duplicateError = error as { code?: number };
    if (params.clientMessageId && duplicateError.code === 11000) {
      const existing = await Message.findOne({
        conversationId: convOid,
        clientMessageId: params.clientMessageId,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Request human handoff: ai → waiting
// Called by the AI escalate_to_human tool
// ---------------------------------------------------------------------------
export async function requestHumanHandoff(params: {
  conversationId: string;
  reason: string;
}): Promise<{ conversation: IConversation; systemMessage: IMessage } | null> {
  await connectToDatabase();

  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: "ai" },
    {
      $set: {
        status: "waiting",
        handoffReason: params.reason,
        routingChangedAt: new Date(),
      },
      $inc: { routingVersion: 1 },
    },
    { returnDocument: "after" }
  );

  if (!convo) return null;

  const seq = await nextSequence(convo._id as mongoose.Types.ObjectId);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: "A support agent has been notified.",
    sequence: seq,
    systemEventType: "handoff_requested",
    metadata: {
      fromStatus: "ai",
      toStatus: "waiting",
      reason: params.reason,
    },
  });

  // Emit directly to sockets using the data we just created/updated (zero extra DB reads!)
  emitRouteChangedEvent(
    convo.workspaceId.toString(),
    convo._id.toString(),
    convo.status,
    convo.routingVersion,
    {
      content: systemMsg.content,
      senderType: systemMsg.senderType,
      createdAt: systemMsg.createdAt?.toISOString?.() || new Date().toISOString(),
    }
  ).catch(console.error);
  
  emitListUpdateWithData(convo, systemMsg).catch(console.error);

  return { conversation: convo, systemMessage: systemMsg };
}

// ---------------------------------------------------------------------------
// Claim conversation: waiting → human
// Called when an agent clicks "Accept Handoff" / "Claim"
// ---------------------------------------------------------------------------
export async function claimConversation(params: {
  conversationId: string;
  agentUserId: string;
  agentName?: string;
}): Promise<{ conversation: IConversation; systemMessage: IMessage } | null> {
  await connectToDatabase();

  const agentOid = new mongoose.Types.ObjectId(params.agentUserId);
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: "waiting" },
    {
      $set: {
        status: "human",
        assignedAgentUserId: agentOid,
        routingChangedAt: new Date(),
        routingChangedBy: agentOid,
      },
      $inc: { routingVersion: 1 },
    },
    { returnDocument: "after" }
  );

  if (!convo) return null;

  const agentName = params.agentName || "A support agent";
  const seq = await nextSequence(convo._id as mongoose.Types.ObjectId);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: `${agentName} joined the conversation.`,
    sequence: seq,
    systemEventType: "agent_joined",
    metadata: {
      fromStatus: "waiting",
      toStatus: "human",
      actorUserId: agentOid,
      assignedAgentUserId: agentOid,
    },
  });

  return { conversation: convo, systemMessage: systemMsg };
}

// ---------------------------------------------------------------------------
// Assign / reassign conversation to a different agent
// ---------------------------------------------------------------------------
export async function assignConversation(params: {
  conversationId: string;
  agentUserId: string;
  actorUserId: string;
  agentName?: string;
}): Promise<{ conversation: IConversation; systemMessage: IMessage } | null> {
  await connectToDatabase();

  const agentOid = new mongoose.Types.ObjectId(params.agentUserId);
  const actorOid = new mongoose.Types.ObjectId(params.actorUserId);

  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $in: ["waiting", "human"] } },
    {
      $set: {
        status: "human",
        assignedAgentUserId: agentOid,
        routingChangedAt: new Date(),
        routingChangedBy: actorOid,
      },
      $inc: { routingVersion: 1 },
    },
    { returnDocument: "after" }
  );

  if (!convo) return null;

  const agentName = params.agentName || "An agent";
  const seq = await nextSequence(convo._id as mongoose.Types.ObjectId);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: `Conversation assigned to ${agentName}.`,
    sequence: seq,
    systemEventType: "agent_assigned",
    metadata: {
      fromStatus: "waiting",
      toStatus: "human",
      actorUserId: actorOid,
      assignedAgentUserId: agentOid,
    },
  });

  return { conversation: convo, systemMessage: systemMsg };
}

// ---------------------------------------------------------------------------
// Return to AI: human → ai
// ---------------------------------------------------------------------------
export async function returnConversationToAi(params: {
  conversationId: string;
  actorUserId: string;
}): Promise<{ conversation: IConversation; systemMessage: IMessage } | null> {
  await connectToDatabase();

  const actorOid = new mongoose.Types.ObjectId(params.actorUserId);
  const previous = await Conversation.findOne({
    _id: params.conversationId,
    status: { $in: ["waiting", "human"] },
  }).select("status");

  if (!previous) return null;

  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $in: ["waiting", "human"] } },
    {
      $set: {
        status: "ai",
        routingChangedAt: new Date(),
        routingChangedBy: actorOid,
      },
      $unset: { assignedAgentUserId: 1 },
      $inc: { routingVersion: 1 },
    },
    { returnDocument: "after" }
  );

  if (!convo) return null;

  const seq = await nextSequence(convo._id as mongoose.Types.ObjectId);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: "AI assistant resumed the conversation.",
    sequence: seq,
    systemEventType: "ai_resumed",
    metadata: {
      fromStatus: previous.status,
      toStatus: "ai",
      actorUserId: actorOid,
    },
  });

  return { conversation: convo, systemMessage: systemMsg };
}

// ---------------------------------------------------------------------------
// Resolve conversation
// ---------------------------------------------------------------------------
export async function resolveConversation(params: {
  conversationId: string;
  actorUserId: string;
}): Promise<{ conversation: IConversation; systemMessage: IMessage } | null> {
  await connectToDatabase();

  const actorOid = new mongoose.Types.ObjectId(params.actorUserId);
  const convo = await Conversation.findOneAndUpdate(
    { _id: params.conversationId, status: { $ne: "resolved" } },
    {
      $set: {
        status: "resolved",
        routingChangedAt: new Date(),
        routingChangedBy: actorOid,
      },
      $inc: { routingVersion: 1 },
    },
    { returnDocument: "after" }
  );

  if (!convo) return null;

  const seq = await nextSequence(convo._id as mongoose.Types.ObjectId);
  const systemMsg = await Message.create({
    conversationId: convo._id,
    workspaceId: convo.workspaceId,
    senderType: "system",
    content: "This conversation was marked as resolved.",
    sequence: seq,
    systemEventType: "conversation_resolved",
    metadata: {
      toStatus: "resolved",
      actorUserId: actorOid,
    },
  });

  return { conversation: convo, systemMessage: systemMsg };
}

// ---------------------------------------------------------------------------
// Get current routing state (for AI race guard)
// ---------------------------------------------------------------------------
export async function getRoutingState(conversationId: string) {
  await connectToDatabase();
  const convo = await Conversation.findById(conversationId).select("status routingVersion").lean();
  return convo ? { status: convo.status, routingVersion: convo.routingVersion } : null;
}
