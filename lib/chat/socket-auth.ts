// ---------------------------------------------------------------------------
// Socket.IO Authentication — visitor tickets + agent JWT
// ---------------------------------------------------------------------------

import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { connectToDatabase } from "@/lib/db/connect";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";

// ---------------------------------------------------------------------------
// Visitor Ticket — short-lived JWT issued when widget creates/resumes a chat
// ---------------------------------------------------------------------------
export interface VisitorTicketPayload {
  type: "visitor";
  conversationId: string;
  workspaceId: string;
  visitorId: string;
}

export function createVisitorTicket(payload: Omit<VisitorTicketPayload, "type">): string {
  return jwt.sign({ ...payload, type: "visitor" }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyVisitorTicket(token: string): VisitorTicketPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as VisitorTicketPayload;
    if (decoded.type !== "visitor") return null;
    return decoded;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Agent Token — validates NextAuth JWT (passed as auth.token by dashboard client)
// ---------------------------------------------------------------------------
export interface AgentTokenPayload {
  type: "agent";
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "agent";
}

export function createAgentToken(payload: Omit<AgentTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "agent" }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyAgentToken(token: string): AgentTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
    if (decoded.type !== "agent") return null;
    return decoded;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Socket.IO handshake middleware — authenticates both visitor and agent
// ---------------------------------------------------------------------------
export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token as string | undefined;
  const clientType = socket.handshake.auth?.clientType as "visitor" | "agent" | undefined;

  if (!token || !clientType) {
    return next(new Error("Missing authentication"));
  }

  if (clientType === "visitor") {
    const payload = verifyVisitorTicket(token);
    if (!payload) {
      return next(new Error("Invalid visitor ticket"));
    }
    socket.data.visitorId = payload.visitorId;
    socket.data.conversationId = payload.conversationId;
    socket.data.workspaceId = payload.workspaceId;
    return next();
  }

  if (clientType === "agent") {
    const payload = verifyAgentToken(token);
    if (!payload) {
      return next(new Error("Invalid agent token"));
    }

    // Verify workspace membership
    await connectToDatabase();
    const member = await WorkspaceMember.findOne({
      userId: payload.userId,
      workspaceId: payload.workspaceId,
    });

    if (!member) {
      return next(new Error("Not a workspace member"));
    }

    socket.data.userId = payload.userId;
    socket.data.agentWorkspaceId = payload.workspaceId;
    socket.data.agentRole = member.role;
    return next();
  }

  return next(new Error("Invalid client type"));
}
