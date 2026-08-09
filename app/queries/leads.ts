import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { cacheTag, cacheLife } from "next/cache";

export async function getLeads(workspaceObjectId: string, workspaceStringId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(`leads-${workspaceObjectId}`);
  console.log("🔄 Fetching fresh leads from database for workspace:", workspaceObjectId);
  try {
    await connectToDatabase();

    const leads = await Conversation.find({
      workspaceId: workspaceObjectId,
      $or: [
        { "visitor.email": { $ne: "" } },
        { "visitor.phone": { $ne: "" } }
      ]
    })
      .sort({ createdAt: -1 })
      .select("visitor status createdAt visitorId")
      .lean();

    return {
      success: true,
      leads: leads.map(l => ({
        id: l._id.toString(),
        visitorId: l.visitorId,
        name: l.visitor?.name || "",
        email: l.visitor?.email || "",
        phone: l.visitor?.phone || "",
        status: l.status,
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt
      }))
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch leads",
      leads: []
    };
  }
}
