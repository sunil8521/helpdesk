import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import mongoose from "mongoose";

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export async function getDashboardStats(workspaceId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`dashboard-${workspaceId}`);
  
  try {
    await connectToDatabase();

    const wId = new mongoose.Types.ObjectId(workspaceId);

    // 1. Total Conversations
    const totalConversations = await Conversation.countDocuments({ workspaceId: wId });

    // 2. Human Handoffs (any conversation that has a non-empty handoffReason)
    const humanHandoffs = await Conversation.countDocuments({ 
      workspaceId: wId, 
      handoffReason: { $exists: true, $ne: "" } 
    });

    // 3. Average Response Time
    // We sample the last 100 messages to calculate the gap between 'user' and subsequent 'ai'/'agent' message
    const recentMessages = await Message.find({ workspaceId: wId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    // Sort ascending for calculation
    recentMessages.reverse();

    let totalWaitTimeMs = 0;
    let responseCount = 0;
    let lastUserMessageTime: Date | null = null;

    for (const msg of recentMessages) {
      if (msg.senderType === "visitor") {
        lastUserMessageTime = msg.createdAt;
      } else if (msg.senderType === "ai" || msg.senderType === "agent") {

        
        if (lastUserMessageTime) {
          const waitTime = msg.createdAt.getTime() - lastUserMessageTime.getTime();
          if (waitTime >= 0 && waitTime < 1000 * 60 * 60) { // Ignore crazy outliers > 1 hour
            totalWaitTimeMs += waitTime;
            responseCount++;
          }
          lastUserMessageTime = null; // Wait for next user message
        }
      }
    }

    const avgResponseMs = responseCount > 0 ? Math.floor(totalWaitTimeMs / responseCount) : 0;
    const avgResponseTimeFormatted = responseCount > 0 ? formatDuration(avgResponseMs) : "0s";

    return {
      success: true,
      totalConversations,
      humanHandoffs,
      avgResponseTimeFormatted
    };
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return {
      success: false,
      totalConversations: 0,
      humanHandoffs: 0,
      avgResponseTimeFormatted: "0",
    };
  }
}
