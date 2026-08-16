// ---------------------------------------------------------------------------
// Socket.IO Server — handles ONLY human-mode real-time chat
// AI mode goes through server actions (no socket needed)
// ---------------------------------------------------------------------------

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { socketAuthMiddleware } from "./socket-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { User } from "@/lib/db/models/User";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import * as routingService from "./routing-service";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  SocketMessage,
} from "./socket-events";
import { getCompiledGraph } from "@/lib/ai/graph";
import { SystemMessage } from "@langchain/core/messages";

// Singleton reference
let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null = null;

export function getIO() {
  return io;
}

// ---------------------------------------------------------------------------
// Serialize a mongoose message doc to SocketMessage
// ---------------------------------------------------------------------------
function serializeMessage(msg: any): SocketMessage {
  return {
    _id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    workspaceId: msg.workspaceId.toString(),
    senderType: msg.senderType,
    senderUserId: msg.senderUserId?.toString(),
    content: msg.content,
    sequence: msg.sequence,
    clientMessageId: msg.clientMessageId,
    systemEventType: msg.systemEventType,
    metadata: msg.metadata,
    createdAt: msg.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

async function updateAiSessionState(threadId: string, content: string) {
  const graph = await getCompiledGraph();
  await graph.updateState(
    { configurable: { thread_id: threadId } },
    { messages: [new SystemMessage(content)] }
  );
}

// ---------------------------------------------------------------------------
// Emit list update to dashboard
// ---------------------------------------------------------------------------
async function emitListUpdate(conversationId: string) {
  if (!io) return;

  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) return;

  const last = await Message.findOne({ conversationId: convo._id })
    .sort({ sequence: -1 })
    .lean();

  let assignedAgentName: string | undefined;
  if (convo.assignedAgentUserId) {
    const agent = await User.findById(convo.assignedAgentUserId).select("name").lean();
    if (agent) {
      assignedAgentName = agent.name;
    }
  }

  io.to(`workspace:${convo.workspaceId.toString()}:team`).emit(
    "conversation:list-updated",
    {
      _id: convo._id.toString(),
      visitorId: convo.visitorId,
      visitor: convo.visitor,
      status: convo.status,
      assignedAgentUserId: convo.assignedAgentUserId?.toString(),
      assignedAgentName,
      handoffReason: convo.handoffReason,
      routingVersion: convo.routingVersion,
      lastMessage: last
        ? {
          content: last.content,
          senderType: last.senderType,
          createdAt: last.createdAt?.toISOString?.() || "",
        }
        : undefined,
      updatedAt: convo.updatedAt?.toISOString?.() || new Date().toISOString(),
    }
  );
}

export function initSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, restrict this
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const isVisitor = !!socket.data.visitorId;
    const isAgent = !!socket.data.userId;

    console.log(
      `[Socket] Connected: ${isVisitor ? `visitor:${socket.data.visitorId}` : `agent:${socket.data.userId}`}`
    );

    if (isVisitor && socket.data.conversationId) {
      socket.join(`conversation:${socket.data.conversationId}`);
      // Notify dashboard so newly escalated conversations appear in real-time
      emitListUpdate(socket.data.conversationId).catch(console.error);
    }

    // -----------------------------------------------------------------------
    // AGENT: auto-join workspace team room
    // -----------------------------------------------------------------------
    if (isAgent && socket.data.agentWorkspaceId) {
      socket.join(`workspace:${socket.data.agentWorkspaceId}:team`);
      socket.join(`user:${socket.data.userId}`);
    }

    // -----------------------------------------------------------------------
    // conversation:join — agent joins a specific conversation room
    // -----------------------------------------------------------------------
    socket.on("conversation:join", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });

      try {
        await connectToDatabase();
        const convo = await Conversation.findById(conversationId);
        if (
          !convo ||
          convo.workspaceId.toString() !== socket.data.agentWorkspaceId
        ) {
          return ack({ ok: false, error: "Conversation not found" });
        }
        socket.join(`conversation:${conversationId}`);
        ack({ ok: true });
      } catch {
        ack({ ok: false, error: "Server error" });
      }
    });

    // -----------------------------------------------------------------------
    // message:send — visitor sends message in HUMAN/WAITING mode only
    // (AI mode goes through sendMessageToAi server action)
    // -----------------------------------------------------------------------
    socket.on("message:send", async ({ clientMessageId, content }, ack) => {
      if (!isVisitor) return ack({ ok: false, error: "Not authorized" });

      const conversationId = socket.data.conversationId!;
      const workspaceId = socket.data.workspaceId!;

      try {
        await connectToDatabase();

        // Save visitor message
        const visitorMsg = await routingService.createMessage({
          conversationId,
          workspaceId,
          senderType: "visitor",
          content,
          clientMessageId,
        });

        const serialized = serializeMessage(visitorMsg);

        // Emit to conversation room (visitor + agents viewing)
        io!
          .to(`conversation:${conversationId}`)
          .emit("message:created", serialized);

        // Update dashboard list
        emitListUpdate(conversationId).catch(console.error);

        ack({ ok: true, message: serialized });
      } catch (err) {
        console.error("[Socket] message:send error:", err);
        ack({ ok: false, error: "Failed to send message" });
      }
    });

   
    socket.on(
      "agent:message:send",
      async ({ conversationId, clientMessageId, content }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });

        try {
          await connectToDatabase();

          // Quick auth check: verify workspace matches
          const convo = await Conversation.findById(conversationId).select(
            "workspaceId status"
          );
          if (
            !convo ||
            convo.workspaceId.toString() !== socket.data.agentWorkspaceId
          ) {
            return ack({ ok: false, error: "Conversation not found" });
          }

          // Auto-claim if waiting
          if (convo.status === "waiting") {
            const user = await User.findById(socket.data.userId);
            const result = await routingService.claimConversation({
              conversationId,
              agentUserId: socket.data.userId!,
              agentName: user?.name,
            });
            if (result) {
              const sysMsg = serializeMessage(result.systemMessage);
              io!
                .to(`conversation:${conversationId}`)
                .emit("message:created", sysMsg);
              io!
                .to(`conversation:${conversationId}`)
                .emit("conversation:route-changed", {
                  conversationId,
                  status: "human",
                  assignedAgentUserId: socket.data.userId,
                  routingVersion: result.conversation.routingVersion,
                  systemMessage: sysMsg,
                });
              io!
                .to(
                  `workspace:${socket.data.agentWorkspaceId}:team`
                )
                .emit("conversation:route-changed", {
                  conversationId,
                  status: "human",
                  assignedAgentUserId: socket.data.userId,
                  routingVersion: result.conversation.routingVersion,
                  systemMessage: sysMsg,
                });
            }
          }

          // Save agent message
          const agentMsg = await routingService.createMessage({
            conversationId,
            workspaceId: convo.workspaceId.toString(),
            senderType: "agent",
            senderUserId: socket.data.userId,
            content,
            clientMessageId,
          });

          const serialized = serializeMessage(agentMsg);
          io!
            .to(`conversation:${conversationId}`)
            .emit("message:created", serialized);

          emitListUpdate(conversationId).catch(console.error);

          ack({ ok: true, message: serialized });
        } catch (err) {
          console.error("[Socket] agent:message:send error:", err);
          ack({ ok: false, error: "Failed to send message" });
        }
      }
    );

    // -----------------------------------------------------------------------
    // conversation:claim — agent claims a waiting conversation
    // -----------------------------------------------------------------------
    socket.on("conversation:claim", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });

      try {
        await connectToDatabase();
        const user = await User.findById(socket.data.userId);
        const result = await routingService.claimConversation({
          conversationId,
          agentUserId: socket.data.userId!,
          agentName: user?.name,
        });

        if (!result)
          return ack({
            ok: false,
            error: "Cannot claim — conversation not in waiting state",
          });

        const sysMsg = serializeMessage(result.systemMessage);
        io!
          .to(`conversation:${conversationId}`)
          .emit("message:created", sysMsg);
        io!
          .to(`conversation:${conversationId}`)
          .emit("conversation:route-changed", {
            conversationId,
            status: "human",
            assignedAgentUserId: socket.data.userId,
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg,
          });
        io!
          .to(`workspace:${socket.data.agentWorkspaceId}:team`)
          .emit("conversation:route-changed", {
            conversationId,
            status: "human",
            assignedAgentUserId: socket.data.userId,
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg,
          });
        emitListUpdate(conversationId).catch(console.error);

        ack({ ok: true });
      } catch {
        ack({ ok: false, error: "Server error" });
      }
    });

    // -----------------------------------------------------------------------
    // conversation:assign — assign to a different agent
    // -----------------------------------------------------------------------
    socket.on(
      "conversation:assign",
      async ({ conversationId, agentUserId }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });

        try {
          await connectToDatabase();
          const member = await WorkspaceMember.findOne({
            userId: agentUserId,
            workspaceId: socket.data.agentWorkspaceId,
          });
          if (!member)
            return ack({
              ok: false,
              error: "Agent is not in this workspace",
            });

          const user = await User.findById(agentUserId);
          const result = await routingService.assignConversation({
            conversationId,
            agentUserId,
            actorUserId: socket.data.userId!,
            agentName: user?.name,
          });

          if (!result)
            return ack({ ok: false, error: "Cannot assign conversation" });

          const sysMsg = serializeMessage(result.systemMessage);
          io!
            .to(`conversation:${conversationId}`)
            .emit("message:created", sysMsg);
          io!
            .to(`conversation:${conversationId}`)
            .emit("conversation:route-changed", {
              conversationId,
              status: "human",
              assignedAgentUserId: agentUserId,
              routingVersion: result.conversation.routingVersion,
              systemMessage: sysMsg,
            });
          io!
            .to(`workspace:${socket.data.agentWorkspaceId}:team`)
            .emit("conversation:route-changed", {
              conversationId,
              status: "human",
              assignedAgentUserId: agentUserId,
              routingVersion: result.conversation.routingVersion,
              systemMessage: sysMsg,
            });
          emitListUpdate(conversationId).catch(console.error);

          ack({ ok: true });
        } catch {
          ack({ ok: false, error: "Server error" });
        }
      }
    );

    socket.on(
      "conversation:return-to-ai",
      async ({ conversationId }, ack) => {
        if (!isAgent) return ack({ ok: false, error: "Not authorized" });

        try {
          const result = await routingService.returnConversationToAi({
            conversationId,
            actorUserId: socket.data.userId!,
          });

          if (!result)
            return ack({ ok: false, error: "Cannot return to AI" });

          // Use updateState to inject a message indicating the human has returned control
          try {
            await updateAiSessionState(
              result.conversation.visitorId,
              "[SYSTEM NOTIFICATION]: The human session has ended and the chat is back in AI mode. Resume normal conversation. Do not escalate to a human unless the user explicitly asks for it again."
            );
          } catch (e) {
            console.error("Failed to update LangGraph state on return to AI:", e);
          }

          const sysMsg = serializeMessage(result.systemMessage);
          io!
            .to(`conversation:${conversationId}`)
            .emit("message:created", sysMsg);
          io!
            .to(`conversation:${conversationId}`)
            .emit("conversation:route-changed", {
              conversationId,
              status: "ai",
              routingVersion: result.conversation.routingVersion,
              systemMessage: sysMsg,
            });
          io!
            .to(`workspace:${socket.data.agentWorkspaceId}:team`)
            .emit("conversation:route-changed", {
              conversationId,
              status: "ai",
              routingVersion: result.conversation.routingVersion,
              systemMessage: sysMsg,
            });
          emitListUpdate(conversationId).catch(console.error);

          ack({ ok: true });
        } catch {
          ack({ ok: false, error: "Server error" });
        }
      }
    );

    // -----------------------------------------------------------------------
    // conversation:resolve — only when agent is handling (human status)
    // -----------------------------------------------------------------------
    socket.on("conversation:resolve", async ({ conversationId }, ack) => {
      if (!isAgent) return ack({ ok: false, error: "Not authorized" });

      try {
        // Only allow resolve when status is "human"
        const convo = await Conversation.findById(conversationId).select("status");
        if (!convo || convo.status !== "human") {
          return ack({
            ok: false,
            error: "Can only resolve when an agent is handling the conversation",
          });
        }

        const result = await routingService.resolveConversation({
          conversationId,
          actorUserId: socket.data.userId!,
        });

        if (!result) return ack({ ok: false, error: "Cannot resolve" });

        // Use updateState to inject a message indicating the human has resolved the issue
        try {
          await updateAiSessionState(
            result.conversation.visitorId,
            "[SYSTEM NOTIFICATION]: The human support agent has resolved the issue and ended the session. The user may ask new questions."
          );
        } catch (e) {
          console.error("Failed to update LangGraph state on resolve:", e);
        }

        const sysMsg = serializeMessage(result.systemMessage);
        io!
          .to(`conversation:${conversationId}`)
          .emit("message:created", sysMsg);
        io!
          .to(`conversation:${conversationId}`)
          .emit("conversation:route-changed", {
            conversationId,
            status: "resolved",
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg,
          });
        io!
          .to(`workspace:${socket.data.agentWorkspaceId}:team`)
          .emit("conversation:route-changed", {
            conversationId,
            status: "resolved",
            routingVersion: result.conversation.routingVersion,
            systemMessage: sysMsg,
          });
        emitListUpdate(conversationId).catch(console.error);

        ack({ ok: true });
      } catch {
        ack({ ok: false, error: "Server error" });
      }
    });

    // -----------------------------------------------------------------------
    // Disconnect
    // -----------------------------------------------------------------------
    socket.on("disconnect", () => {
      console.log(
        `[Socket] Disconnected: ${isVisitor ? `visitor:${socket.data.visitorId}` : `agent:${socket.data.userId}`}`
      );
    });
  });

  console.log("[Socket.IO] Server initialized");
  return io;
}
