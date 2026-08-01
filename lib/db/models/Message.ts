import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICitation {
  title: string;
  sourceId?: mongoose.Types.ObjectId;
}

export interface IMessageMetadata {
  fromStatus?: "ai" | "waiting" | "human" | "resolved";
  toStatus?: "ai" | "waiting" | "human" | "resolved";
  actorUserId?: mongoose.Types.ObjectId;
  assignedAgentUserId?: mongoose.Types.ObjectId;
  reason?: string;
}

export type SystemEventType =
  | "handoff_requested"
  | "agent_joined"
  | "agent_assigned"
  | "ai_resumed"
  | "conversation_resolved";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  senderType: "visitor" | "ai" | "agent" | "system";
  senderUserId?: mongoose.Types.ObjectId; // If senderType === 'agent'
  content: string;
  citations?: ICitation[];

  // Realtime fields
  sequence: number;
  clientMessageId?: string;
  systemEventType?: SystemEventType;
  metadata?: IMessageMetadata;

  createdAt: Date;
}

const CitationSchema = new Schema<ICitation>({
  title: { type: String, required: true },
  sourceId: { type: Schema.Types.ObjectId, ref: "KnowledgeSource" },
});

const MessageMetadataSchema = new Schema<IMessageMetadata>(
  {
    fromStatus: { type: String, enum: ["ai", "waiting", "human", "resolved"] },
    toStatus: { type: String, enum: ["ai", "waiting", "human", "resolved"] },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAgentUserId: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String },
  },
  { _id: false }
);

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

    // Realtime fields
    sequence: { type: Number, required: true, default: 0 },
    clientMessageId: { type: String, sparse: true },
    systemEventType: {
      type: String,
      enum: ["handoff_requested", "agent_joined", "agent_assigned", "ai_resumed", "conversation_resolved"],
    },
    metadata: MessageMetadataSchema,

    createdAt: { type: Date, default: Date.now, index: true },
  }
);

// Idempotency index: prevent duplicate messages from unstable connections
MessageSchema.index(
  { conversationId: 1, clientMessageId: 1 },
  { unique: true, sparse: true }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
