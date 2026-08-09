"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateFileSignature } from "@/lib/utils/file-validation";
import { uploadFileDirectToR2 } from "@/lib/storage/client-upload";
import { createKnowledgeSourceAction } from "@/app/actions/knowledge";
import {
  UploadCloud,
  FileText,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";

interface KnowledgeQuickAddProps {
  workspaceId: string;
  isAgent?: boolean;
}

export function KnowledgeQuickAdd({ workspaceId, isAgent }: KnowledgeQuickAddProps) {
  const router = useRouter();
  
  const [activeAddTab, setActiveAddTab] = useState<"url" | "text" | "file">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Upload Failed", description: err?.message || "File upload failed.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAgent) return null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
          <Sparkles className="h-4.5 w-4.5 text-brand" />
          <span>Quick Add Source</span>
        </div>
        <div className="flex items-center overflow-x-auto whitespace-nowrap bg-muted p-1 rounded-xl text-[11.5px] sm:text-[12.5px] font-semibold w-full sm:w-fit gap-1 no-scrollbar">
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
            disabled={isSubmitting || !urlInput.trim() || isAgent}
            title={isAgent ? "Only admins and owners can add documents" : undefined}
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
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste raw text or FAQ guidelines here..."
              className="min-h-[44px] max-h-[300px] rounded-xl bg-background border-border/50 text-[14px] resize-y py-3"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAddText}
              disabled={isSubmitting || !textContent.trim() || isAgent}
              title={isAgent ? "Only admins and owners can add documents" : undefined}
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
            disabled={isAgent||isSubmitting}
            title={isAgent ? "Only admins and owners can add documents" : undefined}
            className={`absolute inset-0 opacity-0 cursor-pointer w-full h-full ${isAgent ? 'cursor-not-allowed' : ''}`}
          />
          <div className="flex items-center justify-center gap-3">
            <UploadCloud className="h-5 w-5 text-brand" />
            <span className="text-[14px] font-bold text-foreground">Click to upload PDF, DOCX, TXT, or MD</span>
            <span className="text-[12px] text-foreground/45">(Magic byte verified up to 20MB)</span>
          </div>
        </div>
      )}
    </div>
  );
}
