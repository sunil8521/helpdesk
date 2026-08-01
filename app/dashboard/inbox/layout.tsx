import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { getInboxConversations } from "@/lib/chat/inbox-service";
import { redirect } from "next/navigation";
import { InboxSidebar } from "@/components/inbox/inbox-sidebar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const context = await resolveUserWorkspace();
  if (!context) {
    redirect("/login");
  }

  const { conversations } = await getInboxConversations(context.workspace._id.toString());

  return (
    <div className="h-[calc(100vh-68px)] sm:h-[calc(100vh-72px)] overflow-hidden grid grid-cols-1 md:grid-cols-[310px_minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)_340px] bg-background">
      
      {/* ── Left Column: Conversation List ── */}
      <div className="border-r border-border/40 flex flex-col h-full min-w-0 bg-card select-none overflow-y-auto">
        <InboxSidebar initialConversations={conversations || []} />
      </div>

      {/* ── Center + Right Columns: rendered by children (ChatWindow handles both) ── */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center h-full col-span-1 lg:col-span-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
}
