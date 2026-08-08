"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { cn } from "@/lib/utils";
import { useSocket } from "@/lib/chat/use-socket";
import { getAgentSocketToken } from "@/app/actions/chat";
import { useRouter, useParams } from "next/navigation";
import type { SocketConversationRow, SocketRouteChange } from "@/lib/chat/socket-events";

const filters = [
  { k: "all", label: "All" },
  { k: "unassigned", label: "Unassigned" },
  { k: "ai", label: "AI" },
  { k: "human", label: "Human" },
  { k: "mine", label: "Assigned to me" },
  { k: "resolved", label: "Resolved" },
];

export function InboxSidebar({ initialConversations }: { initialConversations: any[] }) {
  const router = useRouter();
  const params = useParams();
  const selectedId = params?.conversationId as string | undefined;

  const [convs, setConvs] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [agentToken, setAgentToken] = useState<string | null>(null);

  // Get agent token for Socket.IO via server action
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
            ? {
              ...c,
              status: change.status,
              assignedAgentUserId: change.assignedAgentUserId,
              routingVersion: change.routingVersion,
            }
            : c
        )
      );
    };

    const handleListUpdated = (row: SocketConversationRow) => {
      setConvs((prev) => {
        const exists = prev.find((c) => c._id === row._id);
        if (exists) {
          return prev.map((c) => (c._id === row._id ? { ...c, ...row } : c));
        }
        return [
          {
            ...row,
            createdAt: row.createdAt || row.updatedAt,
            assignedAgentName: row.assignedAgentName || undefined,
          },
          ...prev,
        ];
      });
    };

    socket.on("conversation:route-changed", handleRouteChanged);
    socket.on("conversation:list-updated", handleListUpdated);

    return () => {
      socket.off("conversation:route-changed", handleRouteChanged);
      socket.off("conversation:list-updated", handleListUpdated);
    };
  }, [socket, router]);

  const list = useMemo(() => {
    let filtered = convs;

    if (filter !== "all") {
      if (filter === "unassigned") {
        filtered = filtered.filter((c) => !c.assignedAgentUserId && c.status !== "resolved");
      } else if (filter === "resolved") {
        filtered = filtered.filter((c) => c.status === "resolved");
      } else if (filter === "ai") {
        filtered = filtered.filter((c) => c.status === "ai");
      } else if (filter === "human") {
        filtered = filtered.filter((c) => c.status === "human");
      } else if (filter === "waiting") {
        filtered = filtered.filter((c) => c.status === "waiting");
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.visitor?.name?.toLowerCase().includes(q) ||
          c.visitor?.email?.toLowerCase().includes(q) ||
          c.lastMessage?.content?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [convs, search, filter]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  };

  return (
    <>
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-border/40 space-y-3 bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/35" />
          <Input
            placeholder="Search conversations…"
            className="pl-9 h-9 rounded-xl text-[13px] bg-background border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {filters.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={cn(
                "text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer",
                filter === f.k
                  ? "bg-brand text-white shadow-xs"
                  : "text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30 scrollbar-none">
        {list.length === 0 && (
          <div className="p-10 text-center text-[13px] text-foreground/40 space-y-2">
            <Filter className="h-6 w-6 mx-auto opacity-40 text-brand" />
            <p>No conversations match this filter.</p>
          </div>
        )}
        {list.map((c) => {
          const isSelected = selectedId === c._id;
          return (
            <button
              key={c._id}
              onClick={() => router.push(`/dashboard/inbox/${c._id}`)}
              className={cn(
                "w-full text-left p-3.5 transition-all duration-200 cursor-pointer block",
                isSelected
                  ? "bg-brand/[0.06] border-l-4 border-l-brand"
                  : "hover:bg-foreground/[0.02]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-8.5 w-8.5 rounded-full bg-brand/10 text-brand grid place-items-center text-[11.5px] font-bold shrink-0">
                  {getInitials(c.visitor?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-bold text-foreground truncate">{c.visitor?.name || "Anonymous"}</span>
                    <span className="text-[11px] text-foreground/40 font-medium shrink-0">{formatTime(c.lastMessage?.createdAt || c.updatedAt)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-foreground/50 truncate leading-snug">{c.lastMessage?.content || "No messages yet"}</p>
                  <div className="mt-2 flex items-center justify-between gap-1.5">
                    <StatusBadge status={c.status} />
                    {c.assignedAgentName && <span className="text-[11px] font-medium text-foreground/40">· {c.assignedAgentName}</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
