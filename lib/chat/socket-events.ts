// ---------------------------------------------------------------------------
// Shared Socket.IO event type definitions
// Used by both server (socket-server.ts) and client (widget, inbox)
// ---------------------------------------------------------------------------

import type { SystemEventType, IMessageMetadata } from "@/lib/db/models/Message";

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

/** Serialized message payload sent over the wire */
export interface SocketMessage {
  _id: string;
  conversationId: string;
  workspaceId: string;
  senderType: "visitor" | "ai" | "agent" | "system";
  senderUserId?: string;
  content: string;
  sequence: number;
  clientMessageId?: string;
  systemEventType?: SystemEventType;
  metadata?: IMessageMetadata;
  createdAt: string;
}

/** Lightweight conversation row for inbox list updates */
export interface SocketConversationRow {
  _id: string;
  visitorId: string;
  visitor: { name: string; email?: string; device?: string; currentPage?: string };
  status: "ai" | "waiting" | "human" | "resolved";
  assignedAgentUserId?: string;
  assignedAgentName?: string;
  handoffReason?: string;
  routingVersion: number;
  lastMessage?: { content: string; senderType: string; createdAt: string };
  createdAt?: string;
  updatedAt: string;
}

/** Route change payload */
export interface SocketRouteChange {
  conversationId: string;
  status: "ai" | "waiting" | "human" | "resolved";
  assignedAgentUserId?: string;
  routingVersion: number;
  systemMessage: SocketMessage;
}

// ---------------------------------------------------------------------------
// Client → Server events
// ---------------------------------------------------------------------------
export interface ClientToServerEvents {
  "conversation:join": (
    data: { conversationId: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void;

  "message:send": (
    data: { clientMessageId: string; content: string },
    ack: (res: { ok: boolean; message?: SocketMessage; error?: string }) => void
  ) => void;

  "agent:message:send": (
    data: { conversationId: string; clientMessageId: string; content: string },
    ack: (res: { ok: boolean; message?: SocketMessage; error?: string }) => void
  ) => void;

  "conversation:claim": (
    data: { conversationId: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void;

  "conversation:assign": (
    data: { conversationId: string; agentUserId: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void;

  "conversation:return-to-ai": (
    data: { conversationId: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void;

  "conversation:resolve": (
    data: { conversationId: string },
    ack: (res: { ok: boolean; error?: string }) => void
  ) => void;
}

// ---------------------------------------------------------------------------
// Server → Client events
// ---------------------------------------------------------------------------
export interface ServerToClientEvents {
  "message:created": (message: SocketMessage) => void;
  "conversation:route-changed": (change: SocketRouteChange) => void;
  "conversation:list-updated": (row: SocketConversationRow) => void;
  "knowledge:progress": (data: {
    sourceId: string;
    status: "uploading" | "uploaded" | "queued" | "processing" | "completed" | "failed" | "unable_to_queue" | "unable_to_parse" | "unable_to_chunk";
    progress?: number;
    errorMessage?: string;
  }) => void;
}

// ---------------------------------------------------------------------------
// Socket data stored on each connection
// ---------------------------------------------------------------------------
export interface SocketData {
  // Visitor connections
  visitorId?: string;
  conversationId?: string;
  workspaceId?: string;

  // Agent connections
  userId?: string;
  agentWorkspaceId?: string;
  agentRole?: "owner" | "admin" | "agent";
}
