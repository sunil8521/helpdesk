import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvite extends Document {
  workspaceId: mongoose.Types.ObjectId;
  email: string;
  role: "owner" | "admin" | "agent";
  token: string;
  status: "pending" | "accepted" | "expired";
  invitedByUserId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["owner", "admin", "agent"], default: "agent" },
    token: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Invite: Model<IInvite> =
  mongoose.models.Invite || mongoose.model<IInvite>("Invite", InviteSchema);
