import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICitation {
  title: string;
  sourceId?: mongoose.Types.ObjectId;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  senderType: "visitor" | "ai" | "agent" | "system";
  senderUserId?: mongoose.Types.ObjectId; // If senderType === 'agent'
  content: string;
  citations?: ICitation[];
  createdAt: Date;
}

const CitationSchema = new Schema<ICitation>({
  title: { type: String, required: true },
  sourceId: { type: Schema.Types.ObjectId, ref: "KnowledgeSource" },
});

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    senderType: {
      type: String,
      enum: ["visitor", "ai", "agent", "system"],
      required: true,
    },
    senderUserId: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    citations: [CitationSchema],
    createdAt: { type: Date, default: Date.now, index: true },
  }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
