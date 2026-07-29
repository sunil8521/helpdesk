import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgent extends Document {
  workspaceId: mongoose.Types.ObjectId; // 1:1 relationship with Workspace
  name: string; // e.g. "Maya"
  role: string; // e.g. "E-commerce Shopping Assistant"
  description: string; // System prompt instructions ("describe the agent you want to create")
  tone: "Friendly" | "Professional" | "Concise" | "Technical";
  responseLength: "Minimalist" | "Standard" | "Detailed";
  aiModel: string; // e.g. "gemini-2.5-flash"
  temperature: number; // default: 0.3
  confidenceThreshold: number; // default: 0.65
  humanFallbackBehavior: "escalate" | "cannot"; // 'escalate' | 'cannot'
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true, index: true },
    name: { type: String, required: true, default: "Maya", trim: true },
    role: { type: String, required: true, default: "Customer Support Specialist", trim: true },
    description: { type: String, default: "Help users with product FAQs, order status, and troubleshooting." },
    tone: {
      type: String,
      enum: ["Friendly", "Professional", "Concise", "Technical"],
      default: "Friendly",
    },
    responseLength: {
      type: String,
      enum: ["Minimalist", "Standard", "Detailed"],
      default: "Standard",
    },
    aiModel: { type: String, default: "gemini-2.5-flash" },
    temperature: { type: Number, default: 0.3, min: 0, max: 1 },
    confidenceThreshold: { type: Number, default: 0.65, min: 0, max: 1 },
    humanFallbackBehavior: {
      type: String,
      enum: ["escalate", "cannot"],
      default: "escalate",
    },
  },
  { timestamps: true }
);

export const Agent: Model<IAgent> =
  mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);
