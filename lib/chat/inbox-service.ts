

import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { User } from "@/lib/db/models/User";

// ---------------------------------------------------------------------------
// Get conversations for workspace inbox
// ---------------------------------------------------------------------------
export async function getInboxConversations(workspaceId: string, filter?: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(`inbox-${workspaceId}`);
  try {
    await connectToDatabase();

    const query: any = { workspaceId };

    if (filter && filter !== "all") {
      if (filter === "unassigned") {
        query.assignedAgentUserId = { $exists: false };
        query.status = { $ne: "resolved" };
      } else if (filter === "resolved") {
        query.status = "resolved";
      } else if (filter === "ai") {
        query.status = "ai";
      } else if (filter === "human") {
        query.status = "human";
      } else if (filter === "waiting") {
        query.status = "waiting";
      }
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    // Get last message for each conversation (for preview)
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ sequence: -1 })
          .lean();

        // Get assigned agent name if exists
        let assignedAgentName: string | undefined;
        if (conv.assignedAgentUserId) {
          const agent = await User.findById(conv.assignedAgentUserId).select("name").lean();
          assignedAgentName = agent?.name;
        }

        return {
          _id: conv._id.toString(),
          visitorId: conv.visitorId,
          visitor: conv.visitor ? JSON.parse(JSON.stringify(conv.visitor)) : undefined,
          status: conv.status,
          assignedAgentUserId: conv.assignedAgentUserId?.toString(),
          assignedAgentName,
          handoffReason: conv.handoffReason,
          routingVersion: conv.routingVersion,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                senderType: lastMsg.senderType,
                createdAt: lastMsg.createdAt?.toISOString?.() || "",
              }
            : undefined,
          createdAt: conv.createdAt?.toISOString?.() || "",
          updatedAt: conv.updatedAt?.toISOString?.() || "",
        };
      })
    );

    return { success: true, conversations: enriched };
  } catch (error) {
    console.error("Failed to load inbox conversations:", error);
    return { success: false, conversations: [], error: "Failed to load conversations" };
  }
}

// ---------------------------------------------------------------------------
// Get count of unresolved conversations for the sidebar badge
// ---------------------------------------------------------------------------
export async function getUnresolvedConversationsCount(workspaceId: string) {
  try {
    await connectToDatabase();
    // Usually we show "waiting" or "unassigned" as the badge count
    const count = await Conversation.countDocuments({ 
      workspaceId, 
      status: "waiting" 
    });
    return count;
  } catch (error) {
    console.error("Failed to count conversations:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Get messages for a specific conversation
// ---------------------------------------------------------------------------
export async function getConversationMessages(conversationId: string) {
  try {
    await connectToDatabase();

    const messages = await Message.find({ conversationId })
      .sort({ sequence: 1 })
      .lean();

    const conversation = await Conversation.findById(conversationId).lean();

    return {
      success: true,
      messages: messages.map((m) => ({
        _id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        workspaceId: m.workspaceId.toString(),
        senderType: m.senderType,
        senderUserId: m.senderUserId?.toString(),
        content: m.content,
        sequence: m.sequence,
        clientMessageId: m.clientMessageId,
        systemEventType: m.systemEventType,
        metadata: m.metadata ? {
          fromStatus: m.metadata.fromStatus,
          toStatus: m.metadata.toStatus,
          actorUserId: m.metadata.actorUserId?.toString(),
          assignedAgentUserId: m.metadata.assignedAgentUserId?.toString(),
          reason: m.metadata.reason,
        } : undefined,
        citations: m.citations,
        createdAt: m.createdAt?.toISOString?.() || "",
      })),
      conversation: conversation
        ? {
            _id: conversation._id.toString(),
            status: conversation.status,
            routingVersion: conversation.routingVersion,
            assignedAgentUserId: conversation.assignedAgentUserId?.toString(),
            handoffReason: conversation.handoffReason || "",
            visitor: conversation.visitor ? JSON.parse(JSON.stringify(conversation.visitor)) : undefined,
            createdAt: conversation.createdAt?.toISOString?.() || "",
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to load conversation messages:", error);
    return { success: false, messages: [], conversation: null, error: "Failed to load messages" };
  }
}
