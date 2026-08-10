const PORT = process.env.WS_PORT || "3001";

export async function emitVisitorProfileUpdated(
  workspaceId: string,
  conversationId: string,
  visitorId: string,
  visitorUpdates: any
) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/api/internal/socket-emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: `workspace:${workspaceId.toString()}:team`,
        event: "visitor:profile-updated",
        payload: {
          conversationId,
          visitorId,
          visitorUpdates,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to emit visitor profile update:", error);
  }
}

export async function emitRouteChangedEvent(
  workspaceId: string,
  conversationId: string,
  status: string,
  routingVersion: number,
  systemMessage?: any
) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/api/internal/socket-emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: `workspace:${workspaceId.toString()}:team`,
        event: "conversation:route-changed",
        payload: {
          conversationId,
          status,
          routingVersion,
          systemMessage,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to emit route changed event:", error);
  }
}

export async function emitListUpdateWithData(
  convo: any,
  last: any,
  assignedAgentName?: string
) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/api/internal/socket-emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: `workspace:${convo.workspaceId.toString()}:team`,
        event: "conversation:list-updated",
        payload: {
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
              createdAt: last.createdAt?.toISOString?.() || last.createdAt || "",
            }
            : undefined,
          updatedAt: convo.updatedAt?.toISOString?.() || convo.updatedAt || new Date().toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error("Failed to emit list update event from data:", error);
  }
}

