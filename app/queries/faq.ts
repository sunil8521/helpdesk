import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { Faq } from "@/lib/db/models/Faq";

export async function getFaqs(workspaceId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`faqs-${workspaceId}`);

  await connectToDatabase();
  const faqs = await Faq.find({ workspaceId }).sort({ createdAt: -1 }).lean();
  
  return JSON.parse(JSON.stringify(faqs));
}
