import mongoose from "mongoose";

export interface IFaq extends mongoose.Document {
  workspaceId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  createdAt: Date;
}

const FaqSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Faq = mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);
