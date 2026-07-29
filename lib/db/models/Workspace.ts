import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApiKey {
  keyId: string;
  name: string;
  hashedKey: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface IWorkspace extends Document {
  workspaceId: string; // Human readable (e.g. ws_9f8a2c)
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: "free" | "pro" | "enterprise";
  apiKeys: IApiKey[];
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  keyId: { type: String, required: true },
  name: { type: String, required: true },
  hashedKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "pro" },
    apiKeys: [ApiKeySchema],
  },
  { timestamps: true }
);

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace || mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
