import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkspaceMember extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "agent";
  status: "online" | "offline" | "in_chat";
  assignedChatsCount: number;
  joinedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "admin", "agent"], default: "agent" },
    status: { type: String, enum: ["online", "offline", "in_chat"], default: "online" },
    assignedChatsCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index so a user cannot be added to the same workspace twice
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember: Model<IWorkspaceMember> =
  mongoose.models.WorkspaceMember || mongoose.model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema);
