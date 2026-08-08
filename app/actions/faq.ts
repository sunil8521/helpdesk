"use server";

import { connectToDatabase } from "@/lib/db";
import { Faq } from "@/lib/db/models/Faq";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { cacheLife, cacheTag, updateTag } from "next/cache";

export async function getFaqsAction(workspaceId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`faqs-${workspaceId}`);

  await connectToDatabase();
  const faqs = await Faq.find({ workspaceId }).sort({ createdAt: -1 }).lean();
  
  return JSON.parse(JSON.stringify(faqs));
}

export async function addFaqAction(question: string, answer: string) {
  try {
    const ctx = await resolveUserWorkspace();
    if (!ctx) return { error: "Unauthorized" };

    if (!question.trim() || !answer.trim()) {
      return { error: "Question and Answer are required." };
    }

    await connectToDatabase();
    const newFaq = new Faq({
      workspaceId: ctx.workspace._id,
      question,
      answer,
    });
    await newFaq.save();

    updateTag(`faqs-${ctx.workspace._id.toString()}`);
    return { success: true };
  } catch (error: any) {
    console.error("[addFaqAction] Error:", error);
    return { error: "Failed to add FAQ" };
  }
}

export async function deleteFaqAction(faqId: string) {
  try {
    const ctx = await resolveUserWorkspace();
    if (!ctx) return { error: "Unauthorized" };

    await connectToDatabase();
    await Faq.findOneAndDelete({ _id: faqId, workspaceId: ctx.workspace._id });

    updateTag(`faqs-${ctx.workspace._id.toString()}`);
    return { success: true };
  } catch (error: any) {
    console.error("[deleteFaqAction] Error:", error);
    return { error: "Failed to delete FAQ" };
  }
}
