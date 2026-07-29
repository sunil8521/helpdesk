import mongoose, { Schema, Document, Model } from "mongoose";

export type KnowledgeSourceType = "file" | "url" | "text";

export interface IKnowledgeSource extends Document {
  workspaceId: mongoose.Types.ObjectId;
  sourceType: KnowledgeSourceType; // 'file' | 'url' | 'text'
  title: string;                    // Display title (filename, webpage title, or text snippet title)
  fileUrl?: string;                 // Cloudflare R2 URL for uploaded files, scraped snapshots, or saved text files
  r2Key?: string;                   // Cloudflare R2 object key (e.g. 'helpdesk/documents/ws_123/doc.pdf')
  webUrl?: string;                  // Webpage URL (only populated for sourceType === 'url')
  rawText?: string;                 // Raw text content for sourceType === 'text'
  fileSize?: number;                // Size in bytes
  mimeType?: string;                // e.g. 'application/pdf', 'text/plain', 'text/html'
  status: "pending" | "uploaded" | "processing" | "ready" | "failed";
  chunksCount: number;
  errorMessage?: string;
  uploaderUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeSourceSchema = new Schema<IKnowledgeSource>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    sourceType: {
      type: String,
      enum: ["file", "url", "text"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, default: "" },
    r2Key: { type: String, default: "" },
    webUrl: { type: String, default: "" },
    rawText: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "text/plain" },
    status: {
      type: String,
      enum: ["pending", "uploaded", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },
    chunksCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
    uploaderUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const KnowledgeSource: Model<IKnowledgeSource> =
  mongoose.models.KnowledgeSource || mongoose.model<IKnowledgeSource>("KnowledgeSource", KnowledgeSourceSchema);
