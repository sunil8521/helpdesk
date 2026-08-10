// ---------------------------------------------------------------------------
// useSocket — React hook for Socket.IO connection (used by widget + inbox)
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/chat/socket-events";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  /** "visitor" or "agent" */
  clientType: "visitor" | "agent";
  /** Auth token (visitor ticket or agent JWT) */
  token: string | null;
  /** Whether to connect (set false to delay connection) */
  enabled?: boolean;
}

export function useSocket({ clientType, token, enabled = true }: UseSocketOptions) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !token) return;

    // Connect to the same origin (custom server serves both Next.js and Socket.IO)
    const socket: TypedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      auth: { token, clientType },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(`[Socket] Connected as ${clientType}`);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, clientType, enabled]);

  const getSocket = useCallback(() => socketRef.current, []);

  return { socket: socketRef.current, connected, getSocket };
}
