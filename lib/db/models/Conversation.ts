import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisitorInfo {
  name: string;
  email?: string;
  device?: string;
  currentPage?: string;
}

export interface IConversation extends Document {
  workspaceId: mongoose.Types.ObjectId;
  visitorId: string; // e.g. "v_8f9a2c"
  visitor: IVisitorInfo;
  status: "ai" | "waiting" | "human" | "resolved";
  assignedAgentUserId?: mongoose.Types.ObjectId;
  handoffReason?: string;
  csatRating?: number; // 1 to 5
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    visitor: {
      name: { type: String, required: true, default: "Anonymous Visitor" },
      email: { type: String, default: "" },
      device: { type: String, default: "Desktop / Chrome" },
      currentPage: { type: String, default: "/" },
    },
    status: {
      type: String,
      enum: ["ai", "waiting", "human", "resolved"],
      default: "ai",
      index: true,
    },
    assignedAgentUserId: { type: Schema.Types.ObjectId, ref: "User" },
    handoffReason: { type: String, default: "" },
    csatRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);
