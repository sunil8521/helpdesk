import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVectorMetadata {
  title: string;
  chunkIndex: number;
  sourceType: string;
  sourceUrl?: string;
}

export interface IVector extends Document {
  workspaceId: mongoose.Types.ObjectId; // CRITICAL: Used for Atlas Vector Search filtering!
  sourceId: mongoose.Types.ObjectId;
  text: string;
  embedding: number[]; // 768 or 1536 float dimension vector
  metadata: IVectorMetadata;
  createdAt: Date;
}

const VectorSchema = new Schema<IVector>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    sourceId: { type: Schema.Types.ObjectId, ref: "KnowledgeSource", required: true, index: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }, // Vector float array
    metadata: {
      title: { type: String, required: true },
      chunkIndex: { type: Number, required: true },
      sourceType: { type: String, required: true },
      sourceUrl: { type: String, default: "" },
    },
    createdAt: { type: Date, default: Date.now },
  }
);

export const Vector: Model<IVector> =
  mongoose.models.Vector || mongoose.model<IVector>("Vector", VectorSchema);
