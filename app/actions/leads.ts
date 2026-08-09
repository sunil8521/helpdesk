"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { revalidateTag, revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function captureLeadAction(data: {
  workspaceId: string;
  visitorId: string;
  email: string;
  name?: string;
  phone?: string;
}) {
  try {
    const { workspaceId, visitorId, email, name, phone } = data;

    if (!workspaceId || !visitorId || !email) {
      return { error: "Missing required fields" };
    }

    await connectToDatabase();

    const workspace = await mongoose.model("Workspace").findOne({ workspaceId });
    if (!workspace) {
      return { error: "Workspace not found" };
    }

    let finalName = name || email.split("@")[0];

    const convo = await Conversation.findOneAndUpdate(
      { workspaceId: workspace._id, visitorId },
      {
        $set: {
          "visitor.name": finalName,
          "visitor.email": email,
          "visitor.phone": phone || "",
        },
      },
      { returnDocument: 'after', upsert: true, sort: { createdAt: -1 } }
    );


    revalidateTag(`leads-${workspace._id.toString()}`, "seconds");

    revalidatePath("/dashboard/leads");

    return { success: true };
  } catch (err: any) {
    console.error("[Capture Lead Error]", err);
    return { error: err.message || "Failed to capture lead" };
  }
}
