"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { documents, chunks } from "@/lib/mock-data";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { validateFileSignature } from "@/lib/utils/file-validation";
import { uploadFileDirectToR2 } from "@/lib/storage/client-upload";
import {
  deleteKnowledgeSourceAction,
  checkKnowledgeSourceStatusAction,
  createKnowledgeSourceAction,
} from "@/app/actions/knowledge";
import {
  UploadCloud,
  FileText,
  Search,
  RefreshCw,
  Plus,
  Globe,
  Sparkles,
  Database,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Trash2,
  Eye,
  X,
  Layers,
} from "lucide-react";

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
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeClientViewProps {
  initialSources: SerializedKnowledgeSource[];
  workspaceId: string;
}

export function KnowledgeClientView({ initialSources, workspaceId }: KnowledgeClientViewProps) {
  const router = useRouter();
  const [sources, setSources] = useState<SerializedKnowledgeSource[]>(initialSources);

  // Keep state synced with props when server revalidates
  useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "file" | "url" | "text">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "processing" | "failed">("all");

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState<"url" | "text" | "file">("url");
  const [selectedSource, setSelectedSource] = useState<SerializedKnowledgeSource | null>(null);

  // Form states for quick bar / modal
  const [urlInput, setUrlInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart Polling Loop for active processing jobs
  useEffect(() => {
    const processingSources = sources.filter(
      (s) => s.status === "processing" || s.status === "pending" || s.status === "uploaded"
    );

    if (processingSources.length === 0) return;

    const intervalId = setInterval(async () => {
      const idsToPoll = processingSources.map((s) => s._id);
      const res = await checkKnowledgeSourceStatusAction(idsToPoll);

      if (res.success && res.sources) {
        let changed = false;
        const newSources = [...sources];

        res.sources.forEach((polled) => {
          const s = newSources.find((item) => item._id === polled.id);
          if (s && polled.status !== s.status) {
            changed = true;
            s.status = polled.status;

            if (polled.status === "ready") {
              toast.add({
                title: "Processing Complete",
                description: `"${s.title}" is now ready!`,
                type: "success",
              });
            } else if (polled.status === "failed") {
              toast.add({
                title: "Processing Failed",
                description: `Failed to process "${s.title}".`,
                type: "error",
              });
            }
          }
        });

        if (changed) {
          router.refresh();
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [sources, router]);


  // Filtering logic
  const filteredSources = sources.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || s.sourceType === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handlers for Add Source
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createKnowledgeSourceAction({
        type: "url",
        title: urlInput.trim(),
        url: urlInput.trim(),
      });
      if (res.error) throw new Error(res.error);

      toast.add({ title: "URL Queued", description: "Website page submitted for scraping & chunking.", type: "success" });
      setUrlInput("");
      setIsAddModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Error", description: err?.message || "Failed to submit URL.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddText = async () => {
    if (!textContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createKnowledgeSourceAction({
        type: "text",
        title: textTitle.trim() || "Raw Text Snippet",
        rawText: textContent.trim(),
      });
      if (res.error) throw new Error(res.error);

      toast.add({ title: "Text Saved", description: "Raw text stored and queued for AI embedding.", type: "success" });
      setTextTitle("");
      setTextContent("");
      setIsAddModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Error", description: err?.message || "Failed to save text.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      await validateFileSignature(file);
      const r2Result = await uploadFileDirectToR2({ file, workspaceId });

      const res = await createKnowledgeSourceAction({
        type: "file",
        title: file.name,
        file: {
          r2Key: r2Result.key,
          fileUrl: r2Result.publicUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        },
      });

      if (res.error) throw new Error(res.error);

      toast.add({ title: "Upload Complete", description: `"${file.name}" uploaded to R2 & queued for processing.`, type: "success" });
      setIsAddModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Upload Failed", description: err?.message || "File upload failed.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    try {
      const res = await deleteKnowledgeSourceAction(id);
      if (res.error) throw new Error(res.error);

      toast.add({ title: "Source Deleted", description: `"${name}" and all associated vector chunks removed.`, type: "info" });
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Delete Error", description: err?.message || "Failed to delete source.", type: "error" });
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            RAG Knowledge Base
          </span>
          <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Knowledge <em className="font-display not-italic italic text-brand">Base</em>
          </h1>
          <p className="mt-1 text-[14.5px] text-foreground/50">Manage documents, scraped URLs, raw text, and vector embeddings cited by your AI agent.</p>
        </div>
      </div>

      {/* Quick Action Ingestion Banner */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
            <Sparkles className="h-4.5 w-4.5 text-brand" />
            <span>Quick Add Source</span>
          </div>
          <div className="flex items-center bg-muted p-1 rounded-xl text-[12.5px] font-semibold w-fit">
            <button
              onClick={() => setActiveAddTab("url")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeAddTab === "url" ? "bg-background shadow-xs text-brand" : "text-foreground/60 hover:text-foreground"
                }`}
            >
              <Globe className="h-3.5 w-3.5" /> Crawl URL
            </button>
            <button
              onClick={() => setActiveAddTab("text")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeAddTab === "text" ? "bg-background shadow-xs text-brand" : "text-foreground/60 hover:text-foreground"
                }`}
            >
              <FileText className="h-3.5 w-3.5" /> Paste Text
            </button>
            <button
              onClick={() => setActiveAddTab("file")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeAddTab === "file" ? "bg-background shadow-xs text-brand" : "text-foreground/60 hover:text-foreground"
                }`}
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload File
            </button>
          </div>
        </div>

        {/* Quick URL Bar */}
        {activeAddTab === "url" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-foreground/40" />
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL to crawl (e.g. https://acme.co/docs/getting-started)..."
                className="pl-10 h-11 rounded-xl bg-background border-border/50 text-[14px]"
              />
            </div>
            <Button
              onClick={handleAddUrl}
              disabled={isSubmitting || !urlInput.trim()}
              className="bg-brand text-white hover:bg-brand/85 rounded-xl h-11 px-7 font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crawl & Embed"}
            </Button>
          </div>
        )}

        {/* Quick Text Bar */}
        {activeAddTab === "text" && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-[200px_1fr] gap-3">
              <Input
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Title / Topic..."
                className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
              />
              <Input
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste raw text or FAQ guidelines here..."
                className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleAddText}
                disabled={isSubmitting || !textContent.trim()}
                className="bg-brand text-white hover:bg-brand/85 rounded-xl h-10 px-6 font-semibold cursor-pointer shadow-xs"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Embed"}
              </Button>
            </div>
          </div>
        )}

        {/* Quick File Bar */}
        {activeAddTab === "file" && (
          <div className="relative border-2 border-dashed border-border/60 hover:border-brand/40 bg-background rounded-2xl p-6 text-center space-y-2 cursor-pointer group">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex items-center justify-center gap-3">
              <UploadCloud className="h-5 w-5 text-brand" />
              <span className="text-[14px] font-bold text-foreground">Click to upload PDF, DOCX, TXT, or MD</span>
              <span className="text-[12px] text-foreground/45">(Magic byte verified up to 20MB)</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Sparkles className="h-4 w-4 text-amber" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight flex items-baseline gap-2">
            <span>{sources.filter((s) => s.status === "ready").length} Ready</span>
            {sources.filter((s) => s.status === "processing" || s.status === "pending" || s.status === "uploaded").length > 0 && (
              <span className="text-[14px] text-blue-600 font-semibold">
                ({sources.filter((s) => s.status === "processing" || s.status === "pending" || s.status === "uploaded").length} Active)
              </span>
            )}
          </div>
          <div className="mt-1 text-[11.5px] font-medium text-foreground/40">Auto-polling Inngest background queue</div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Tenant Isolation</span>
            <CheckCircle2 className="h-4 w-4 text-emerald" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">Active</div>
          <div className="mt-1 text-[11.5px] font-medium text-foreground/40">Pre-filtered to workspace</div>
        </div>
      </div>

      {/* Knowledge Sources Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-foreground tracking-tight">
            Knowledge Sources ({sources.length})
          </h2>
          <div className="relative w-72">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSource(s)}
                            className="h-8 px-2.5 rounded-lg text-foreground/70 hover:text-foreground text-[12px] font-semibold cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSource(s._id, s.title)}
                            className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-500/10 text-[12px] font-semibold cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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



      {/* ── DRAWER: Source Details & Chunks ── */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200">
          <div className="bg-background w-full max-w-xl h-full border-l border-border/60 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between shadow-2xl space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand grid place-items-center">
                    {selectedSource.sourceType === "file" && <FileText className="h-5 w-5" />}
                    {selectedSource.sourceType === "url" && <Globe className="h-5 w-5 text-amber" />}
                    {selectedSource.sourceType === "text" && <Sparkles className="h-5 w-5 text-emerald" />}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-foreground truncate max-w-xs">{selectedSource.title}</h3>
                    <span className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground/40">{selectedSource.sourceType} Source</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="h-8 w-8 rounded-full bg-muted grid place-items-center text-foreground/60 hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Source Metadata */}
              <div className="grid grid-cols-2 gap-3 text-[13px] bg-card p-4 rounded-2xl border border-border/50">
                <div>
                  <div className="text-foreground/45 font-medium">Status</div>
                  <div className="mt-1"><StatusBadge status={selectedSource.status} /></div>
                </div>
                <div>
                  <div className="text-foreground/45 font-medium">Chunks Generated</div>
                  <div className="mt-1 font-bold text-foreground">{selectedSource.chunksCount || 0} chunks</div>
                </div>
                <div>
                  <div className="text-foreground/45 font-medium">Date Added</div>
                  <div className="mt-1 font-semibold text-foreground">{new Date(selectedSource.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-foreground/45 font-medium">Source ID</div>
                  <div className="mt-1 font-mono text-[11px] text-foreground/70 truncate">{selectedSource._id}</div>
                </div>
              </div>

              {/* Vector Chunks Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-foreground uppercase tracking-wider">Vector Chunks Preview</h4>
                  <span className="text-[12px] text-brand font-medium">Tenant Isolated</span>
                </div>

                <div className="space-y-3">
                  {chunks.slice(0, 3).map((c, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-card border border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-bold text-brand font-mono">Chunk #{idx}</span>
                        <span className="text-foreground/40">{c.tokens} tokens</span>
                      </div>
                      <p className="text-[13px] text-foreground/75 leading-relaxed">{c.preview}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => handleDeleteSource(selectedSource._id, selectedSource.title)}
                className="text-red-600 hover:bg-red-500/10 rounded-full text-[13px] font-bold"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete Source
              </Button>
              <Button
                onClick={() => setSelectedSource(null)}
                className="bg-brand text-white rounded-full px-6 text-[13.5px] font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
