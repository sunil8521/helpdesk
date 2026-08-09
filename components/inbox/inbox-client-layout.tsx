"use client";

import { usePathname } from "next/navigation";
import { InboxSidebar } from "./inbox-sidebar";
import type { ReactNode } from "react";

export function InboxClientLayout({
  initialConversations,
  children,
}: {
  initialConversations: any[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isConversationActive = pathname?.includes("/dashboard/inbox/") && pathname !== "/dashboard/inbox";

  return (
    <div className="h-[calc(100vh-68px)] sm:h-[calc(100vh-72px)] overflow-hidden flex flex-col md:flex-row bg-background">
      {/* ── Sidebar: Conversation List ── */}
      <div
        className={`bg-card select-none overflow-y-auto shrink-0 md:w-[310px] md:border-r border-border/40 h-full ${
          isConversationActive ? "hidden md:flex flex-col" : "flex flex-col w-full"
        }`}
      >
        <InboxSidebar initialConversations={initialConversations} />
      </div>

      {/* ── Main Content: Chat Window / Empty State ── */}
      <div
        className={`flex-1 min-w-0 h-full bg-background ${
          isConversationActive ? "flex flex-row w-full" : "hidden md:flex flex-col"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
