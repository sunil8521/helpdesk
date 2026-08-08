"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { useSocket } from "@/lib/chat/use-socket";
import { getAgentSocketToken } from "@/app/actions/chat";
import { SocketRouteChange, SocketConversationRow } from "@/lib/chat/socket-events";

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d`;
}

interface DashboardRecentConversationsProps {
  initialConversations: any[];
  totalCount: number;
}

export function DashboardRecentConversations({ initialConversations, totalCount }: DashboardRecentConversationsProps) {
  const [convs, setConvs] = useState(initialConversations);
  const [agentToken, setAgentToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const result = await getAgentSocketToken();
        if (result.token) setAgentToken(result.token);
      } catch (err) {
        console.error("Failed to get agent token:", err);
      }
    }
    fetchToken();
  }, []);

  const { socket } = useSocket({
    clientType: "agent",
    token: agentToken,
    enabled: !!agentToken,
  });

  useEffect(() => {
    if (!socket) return;

    const handleRouteChanged = (change: SocketRouteChange) => {
      setConvs((prev) =>
        prev.map((c) =>
          c._id === change.conversationId
            ? { ...c, status: change.status, assignedAgentUserId: change.assignedAgentUserId }
            : c
        )
      );
    };

    const handleListUpdated = (row: SocketConversationRow) => {
      setConvs((prev) => {
        const exists = prev.find((c) => c._id === row._id);

        let newList;
        if (exists) {
          newList = prev.map((c) =>
            c._id === row._id
              ? {
                ...c,
                status: row.status,
                assignedAgentUserId: row.assignedAgentUserId,
                lastMessage: row.lastMessage,
                updatedAt: row.updatedAt,
              }
              : c
          );
        } else {
          newList = [
            row,
            ...prev,
          ];
        }

        // Keep it sorted by updatedAt desc
        return newList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    socket.on("conversation:route-changed", handleRouteChanged);
    socket.on("conversation:list-updated", handleListUpdated);

    return () => {
      socket.off("conversation:route-changed", handleRouteChanged);
      socket.off("conversation:list-updated", handleListUpdated);
    };
  }, [socket]);

  return (
    <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xs flex flex-col justify-between">
      <div>
        <div className="px-6 py-4.5 border-b border-border/40 flex items-center justify-between bg-card">
          <div>
            <h3 className="font-bold text-[16px] tracking-tight">Recent Conversations</h3>
            <p className="text-[12.5px] text-foreground/45 mt-0.5">Live incoming customer chats</p>
          </div>
          <Link href="/dashboard/inbox" className="text-[13px] font-semibold text-brand hover:underline inline-flex items-center gap-1">
            Open Inbox <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[oklch(0.985_0.003_260)] text-[11.5px] uppercase tracking-wider text-foreground/40 font-semibold border-b border-border/40">
              <tr>
                <th className="text-left font-semibold px-6 py-3">Visitor</th>
                <th className="text-left font-semibold px-6 py-3">Last Message</th>
                <th className="text-left font-semibold px-6 py-3">Status</th>
                <th className="text-left font-semibold px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {convs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-foreground/40 font-medium">
                    No conversations yet.
                  </td>
                </tr>
              ) : (
                convs.slice(0, 5).map((c) => {
                  const visitorName = c.visitor?.name || "Anonymous";
                  const initial = visitorName.charAt(0).toUpperCase();
                  const lastMsgText = c.lastMessage?.content || "Started conversation...";

                  return (
                    <tr key={c._id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-brand/8 text-brand font-bold text-[11px] grid place-items-center shrink-0">
                            {initial}
                          </div>
                          <span className="truncate max-w-[150px]">{visitorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-foreground/50 truncate max-w-[280px]">
                        {lastMsgText}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-3.5 text-foreground/40 font-medium text-[12.5px]">
                        {formatRelativeTime(c.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t border-border/40 bg-[oklch(0.985_0.003_260)] text-center mt-auto">
        <Link href="/dashboard/inbox" className="text-[13px] font-bold text-brand hover:underline inline-flex items-center gap-1">
          View all {totalCount.toLocaleString()} conversations <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
