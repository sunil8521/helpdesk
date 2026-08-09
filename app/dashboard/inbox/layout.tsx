import { resolveUserWorkspace } from "@/lib/auth/resolve-context";
import { getInboxConversations } from "@/lib/chat/inbox-service";
import { redirect } from "next/navigation";
import { InboxSidebar } from "@/components/inbox/inbox-sidebar";
import { InboxClientLayout } from "@/components/inbox/inbox-client-layout";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const context = await resolveUserWorkspace();
  if (!context) {
    redirect("/login");
  }

  const { conversations } = await getInboxConversations(context.workspace._id.toString());

  return (
    <InboxClientLayout initialConversations={conversations || []}>
      {children}
    </InboxClientLayout>
  );
}
