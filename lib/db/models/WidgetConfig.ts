import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWidgetConfig extends Document {
  workspaceId: mongoose.Types.ObjectId; // 1:1 relationship with Workspace
  title: string; // Header title shown on chat window (e.g. "Acme Support")
  greeting: string; // Initial greeting message (e.g. "Hi 👋 How can we help today?")
  avatarUrl?: string; // Widget header brand logo
  themeColor: string; // default: "#4f46e5"
  buttonColor: string; // default: "#4f46e5"
  position: "right" | "left"; // default: "right"
  proactiveMessage: boolean; // default: true
  leadCapture: {
    enabled: boolean;
    requiredFields: string[];
  };
  allowedDomains: string[]; // Origins allowed to load the widget script
  createdAt: Date;
  updatedAt: Date;
}

const WidgetConfigSchema = new Schema<IWidgetConfig>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true, index: true },
    title: { type: String, required: true, default: "Acme Support", trim: true },
    greeting: { type: String, required: true, default: "Hi 👋 How can we help today?", trim: true },
    avatarUrl: { type: String, default: "" },
    themeColor: { type: String, default: "#4f46e5" },
    buttonColor: { type: String, default: "#4f46e5" },
    position: { type: String, enum: ["right", "left"], default: "right" },
    leadCapture: {
      enabled: { type: Boolean, default: false },
      requiredFields: [{ type: String, enum: ["name", "email", "phone"] }],
    },
    proactiveMessage: { type: Boolean, default: true },
    allowedDomains: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export const WidgetConfig: Model<IWidgetConfig> =
  mongoose.models.WidgetConfig || mongoose.model<IWidgetConfig>("WidgetConfig", WidgetConfigSchema);
