"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { createKnowledgeSourceAction } from "@/app/actions/knowledge";
import { validateFileSignature } from "@/lib/utils/file-validation";
import { uploadFileDirectToR2 } from "@/lib/storage/client-upload";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  ChevronRight,
} from "lucide-react";

type IngestionState = "menu" | "knowledge" | "link" | "document";

export function KnowledgeIngestionForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string;
  onSuccess: (source: { id: string; type: "text" | "url" | "file"; title: string }) => void;
}) {
  const [knowledgeSource, setKnowledgeSource] = useState<IngestionState>("menu");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isSavingSource, setIsSavingSource] = useState(false);

  const handleSaveText = async () => {
    if (!textInput.trim()) return;
    setIsSavingSource(true);

    const promise = createKnowledgeSourceAction({
      type: "text",
      title: "Raw Text Guidelines",
      rawText: textInput.trim(),
    }).then((res) => {
      if (res.success && res.sourceId) {
        onSuccess({ id: res.sourceId, type: "text", title: "Raw Text Guidelines" });
        setTextInput("");
        setKnowledgeSource("menu");
      } else {
        throw new Error(res.error || "Failed to save text");
      }
    }).finally(() => {
      setIsSavingSource(false);
    });

    toast.promise(promise, {
      loading: "Saving text to database...",
      success: "Saved and queued for processing!",
      error: "Failed to save text.",
    });
  };

  const handleSaveUrl = async () => {
    if (!urlInput.trim()) return;
    setIsSavingSource(true);

    const promise = createKnowledgeSourceAction({
      type: "url",
      title: urlInput.trim(),
      url: urlInput.trim(),
    }).then((res) => {
      if (res.success && res.sourceId) {
        onSuccess({ id: res.sourceId, type: "url", title: urlInput.trim() });
        setUrlInput("");
        setKnowledgeSource("menu");
      } else {
        throw new Error(res.error || "Failed to save link");
      }
    }).finally(() => {
      setIsSavingSource(false);
    });

    toast.promise(promise, {
      loading: "Saving link...",
      success: "Link queued for scraping & processing!",
      error: "Failed to save link.",
    });
  };

  const handleSaveFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingSource(true);

    const promise = (async () => {
      // 1. Validate magic bytes to prevent spoofing
      await validateFileSignature(file);

      // 2. Upload to R2 via presigned URL
      const r2Data = await uploadFileDirectToR2({ file, workspaceId });

      // 3. Save to DB and trigger Inngest
      const dbRes = await createKnowledgeSourceAction({
        type: "file",
        title: file.name,
        file: {
          r2Key: r2Data.key,
          fileUrl: r2Data.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
        },
      });

      if (dbRes.success && dbRes.sourceId) {
        onSuccess({ id: dbRes.sourceId, type: "file", title: file.name });
        setKnowledgeSource("menu");
      } else {
        throw new Error(dbRes.error || "Failed to save file metadata");
      }
    })().finally(() => {
      setIsSavingSource(false);
    });

    toast.promise(promise, {
      loading: "Validating & Uploading file securely...",
      success: "File uploaded and queued for processing!",
      error: (err) => err instanceof Error ? err.message : "Failed to upload file.",
    });
  };

  if (knowledgeSource === "menu") {
    return (
      <div className="space-y-4 animate-in fade-in-50 duration-200">
        <Label className="text-[13.5px] font-semibold text-foreground/70">Add new knowledge source:</Label>

        {/* Option 1: Raw Text Knowledge */}
        <button
          type="button"
          onClick={() => setKnowledgeSource("knowledge")}
          className="w-full text-left rounded-2xl border border-border/60 bg-card p-5 hover:border-emerald/40 hover:shadow-sm transition-all flex items-center justify-between group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald rounded-l-2xl" />
          <div className="flex items-center gap-4 pl-2">
            <div className="h-11 w-11 rounded-2xl bg-emerald/10 text-emerald grid place-items-center shrink-0">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="font-bold text-[15px] text-foreground tracking-tight">RAW TEXT KNOWLEDGE</div>
              <div className="text-[13px] text-foreground/45 mt-0.5">Write or paste text guidelines & FAQs to train your AI.</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Option 2: Website URL Link */}
        <button
          type="button"
          onClick={() => setKnowledgeSource("link")}
          className="w-full text-left rounded-2xl border border-border/60 bg-card p-5 hover:border-amber/40 hover:shadow-sm transition-all flex items-center justify-between group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber rounded-l-2xl" />
          <div className="flex items-center gap-4 pl-2">
            <div className="h-11 w-11 rounded-2xl bg-amber/10 text-amber grid place-items-center shrink-0">
              <LinkIcon className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="font-bold text-[15px] text-foreground tracking-tight">WEBSITE URL LINK</div>
              <div className="text-[13px] text-foreground/45 mt-0.5">Enter a website URL to crawl pages and train your agent.</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Option 3: Upload Documents */}
        <button
          type="button"
          onClick={() => setKnowledgeSource("document")}
          className="w-full text-left rounded-2xl border border-border/60 bg-card p-5 hover:border-brand/40 hover:shadow-sm transition-all flex items-center justify-between group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand rounded-l-2xl" />
          <div className="flex items-center gap-4 pl-2">
            <div className="h-11 w-11 rounded-2xl bg-brand/10 text-brand grid place-items-center shrink-0">
              <UploadCloud className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="font-bold text-[15px] text-foreground tracking-tight">UPLOAD DOCUMENTS</div>
              <div className="text-[13px] text-foreground/45 mt-0.5">Upload PDF, TXT, or Markdown files to train your agent.</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>
    );
  }

  if (knowledgeSource === "knowledge") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-5 animate-in fade-in-50 duration-200">
        <button
          type="button"
          onClick={() => setKnowledgeSource("menu")}
          className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to options
        </button>
        <div>
          <h3 className="text-[18px] font-bold tracking-tight">Raw Text Guidelines & FAQs</h3>
          <p className="text-[13px] text-foreground/45 mt-0.5">Paste or type custom instructions or knowledge for your agent.</p>
        </div>
        <div className="relative">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={7}
            placeholder="e.g. Refunds are allowed within 30 days of purchase. Support hours are Mon-Fri 9am-5pm EST..."
            className="rounded-2xl bg-background border-border/60 p-4 text-[14px] leading-relaxed focus:border-brand"
          />
          <div className="absolute bottom-3 right-4 text-[11px] font-mono text-foreground/35">
            {textInput.length}/10000
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSaveText}
            disabled={isSavingSource || !textInput.trim()}
            className="bg-emerald text-white hover:bg-emerald/90 rounded-full px-6 h-10 font-semibold text-[13.5px] cursor-pointer disabled:opacity-50"
          >
            {isSavingSource ? "Saving..." : "Save Knowledge Text"}
          </Button>
        </div>
      </div>
    );
  }

  if (knowledgeSource === "link") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-5 animate-in fade-in-50 duration-200">
        <button
          type="button"
          onClick={() => setKnowledgeSource("menu")}
          className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to options
        </button>
        <div>
          <h3 className="text-[18px] font-bold tracking-tight">Website URL Link</h3>
          <p className="text-[13px] text-foreground/45 mt-0.5">Train the AI based on content crawled from your website or documentation.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">Website URL</Label>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://yourwebsite.com/docs"
            className="h-11 rounded-xl text-[14px] bg-background border-border/60"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSaveUrl}
            disabled={isSavingSource || !urlInput.trim()}
            className="bg-amber text-white hover:bg-amber/90 rounded-full px-6 h-10 font-semibold text-[13.5px] cursor-pointer disabled:opacity-50"
          >
            {isSavingSource ? "Saving..." : "Save Link & Crawl"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-5 animate-in fade-in-50 duration-200">
      <button
        type="button"
        onClick={() => setKnowledgeSource("menu")}
        className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to options
      </button>
      <div>
        <h3 className="text-[18px] font-bold tracking-tight">Upload Knowledge Documents</h3>
        <p className="text-[13px] text-foreground/45 mt-0.5">Upload PDFs, TXT, or Markdown files to train your agent.</p>
      </div>
      <label className={cn(
        "rounded-2xl border-2 border-dashed border-border/70 bg-background p-8 text-center space-y-2 cursor-pointer hover:border-brand/50 transition-colors block",
        isSavingSource && "opacity-50 pointer-events-none"
      )}>
        <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleSaveFile} />
        <UploadCloud className="h-8 w-8 mx-auto text-brand" />
        <div className="text-[14px] font-bold">
          {isSavingSource ? "Uploading to secure storage..." : "Drop files here or click to browse"}
        </div>
        <div className="text-[12px] text-foreground/45">Supports PDF, TXT, MD up to 20MB</div>
      </label>
    </div>
  );
}
