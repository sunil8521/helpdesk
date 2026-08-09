"use client";

import { getAgentSocketToken } from "@/app/actions/chat";
import {
  deleteKnowledgeSourceAction,
  retryKnowledgeQueueAction
} from "@/app/actions/knowledge";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useSocket } from "@/lib/chat/use-socket";
import {
  Activity,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface SerializedKnowledgeSource {
  _id: string;
  sourceType: string;
  title: string;
  fileUrl?: string;
  webUrl?: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  chunksCount: number;
  progress?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeClientViewProps {
  initialSources: SerializedKnowledgeSource[];
  workspaceId: string;
  role?: string;
}

export function KnowledgeClientView({ initialSources, workspaceId, role }: KnowledgeClientViewProps) {
  const router = useRouter();
  const isAgent = role === "agent";
  const [sources, setSources] = useState<SerializedKnowledgeSource[]>(initialSources);

  // Keep state synced with props when server revalidates
  useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);


  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "file" | "url" | "text">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "uploaded" | "queued" | "completed" | "failed" | "unable_to_queue">("all");

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Form states for quick bar / modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
    const handleProgress = (data: {
      sourceId: string;
      status: string;
      progress?: number;
      errorMessage?: string;
      chunksCount?: number;
    }) => {
      const existingSource = sources.find(s => s._id === data.sourceId);
      if (existingSource) {
        if (data.status === "completed" && existingSource.status !== "completed") {
          toast.add({
            title: "Processing Complete",
            description: `"${existingSource.title}" is now completed!`,
            type: "success",
          });
        } else if (data.status === "failed" && existingSource.status !== "failed") {
          toast.add({
            title: "Processing Failed",
            description: `Failed to process "${existingSource.title}".`,
            type: "error",
          });
        }
      }

      setSources((prev) => {
        return prev.map((s) => {
          if (s._id === data.sourceId) {
            return {
              ...s,
              status: data.status,
              progress: data.progress,
              errorMessage: data.errorMessage,
              ...(data.chunksCount !== undefined ? { chunksCount: data.chunksCount } : {}),
            };
          }
          return s;
        });
      });
    };

    socket.on("knowledge:progress", handleProgress);
    return () => {
      socket.off("knowledge:progress", handleProgress);
    };
  }, [socket, router]);


  // Filtering logic
  const filteredSources = sources.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || s.sourceType === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });



  const handleRetryQueue = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await retryKnowledgeQueueAction(id);
      if (res.error) throw new Error(res.error);
      toast.add({ title: "Retry Queued", description: "Document queued for processing again.", type: "success" });
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Retry Failed", description: err?.message || "Could not queue document.", type: "error" });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const res = await deleteKnowledgeSourceAction(id);
      if (res.error) throw new Error(res.error);

      toast.add({ title: "Source Deleted", description: `"${name}" and all associated vector chunks removed.`, type: "info" });
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Delete Error", description: err?.message || "Failed to delete source.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">




      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Total Sources</span>
            <Layers className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">{sources.length} Sources</div>
          <div className="mt-1 text-[11.5px] font-medium text-emerald flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Synced with MongoDB Atlas
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Total Chunks</span>
            <Database className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">
            {sources.reduce((acc, curr) => acc + (curr.chunksCount || 0), 0)} Chunks
          </div>
          <div className="mt-1 text-[11.5px] font-medium text-foreground/40">MongoDB vector embeddings</div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Processing Status</span>
            <Activity className="h-4 w-4 text-amber" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight flex items-baseline gap-2">
            <span>{sources.filter((s) => s.status === "completed").length} Completed</span>
            {sources.filter((s) => ["queued", "uploaded"].includes(s.status)).length > 0 && (
              <span className="text-[14px] text-blue-600 font-semibold animate-pulse">
                ({sources.filter((s) => ["queued", "uploaded"].includes(s.status)).length} Active)
              </span>
            )}
          </div>
          <div className="mt-1 text-[11.5px] font-medium text-foreground/40">Auto-polling Inngest background queue</div>
        </div>
      </div>

      {/* Knowledge Sources Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-[16px] sm:text-[18px] font-bold text-foreground tracking-tight whitespace-nowrap">
            Knowledge Sources ({sources.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-foreground/35" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources…"
              className="pl-10 h-9 rounded-xl bg-card border-border/50 text-[13px]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-[oklch(0.985_0.003_260)] text-[11.5px] uppercase tracking-wider text-foreground/40 font-semibold border-b border-border/40">
                <tr>
                  <th className="text-left font-semibold px-6 py-3.5">Source Name</th>
                  <th className="text-left font-semibold px-6 py-3.5">Type</th>
                  <th className="text-left font-semibold px-6 py-3.5">Status</th>
                  <th className="text-left font-semibold px-6 py-3.5">Chunks</th>
                  <th className="text-left font-semibold px-6 py-3.5">Date</th>
                  <th className="text-right font-semibold px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredSources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-foreground/40">
                      No knowledge sources found in database matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredSources.map((s) => (
                    <tr key={s._id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-brand/8 text-brand grid place-items-center shrink-0">
                            {s.sourceType === "file" && <FileText className="h-4.5 w-4.5" />}
                            {s.sourceType === "url" && <Globe className="h-4.5 w-4.5 text-amber" />}
                            {s.sourceType === "text" && <Sparkles className="h-4.5 w-4.5 text-emerald" />}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <div className="font-bold text-foreground truncate">{s.title}</div>
                            {s.webUrl && (
                              <a
                                href={s.webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] text-brand hover:underline flex items-center gap-1 mt-0.5 truncate"
                              >
                                {s.webUrl} <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-foreground/70">
                          {s.sourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{s.chunksCount || "—"}</td>
                      <td className="px-6 py-4 text-foreground/40 font-medium text-[12.5px]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {['unable_to_queue', 'uploaded', 'failed'].includes(s.status.toLowerCase()) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRetryQueue(s._id)}
                              disabled={retryingId === s._id || isAgent}
                              title={isAgent ? "Only admins and owners can modify documents" : undefined}
                              className="h-8 px-2.5 rounded-lg text-brand hover:bg-brand/10 text-[12px] font-semibold cursor-pointer"
                            >
                              {retryingId === s._id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />} Retry
                            </Button>
                          )}
                          {['completed', 'failed', 'unable_to_queue', 'uploaded'].includes(s.status.toLowerCase()) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSource(s._id, s.title)}
                              disabled={deletingId === s._id || isAgent}
                              title={isAgent ? "Only admins and owners can modify documents" : undefined}
                              className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-500/10 text-[12px] font-semibold cursor-pointer"
                            >
                              {deletingId === s._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
}