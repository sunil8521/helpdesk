import { getConversationMessages } from "@/lib/chat/inbox-service";
import { ChatWindow } from "@/components/inbox/chat-window";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = await params;
  const context = await resolveUserWorkspace();
  const { messages, conversation } = await getConversationMessages(resolvedParams.conversationId);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <ChatWindow 
      initialMessages={messages} 
      conversation={conversation}
      agentUserId={context?.userId}
      workspaceId={context?.workspaceId}
      agentName={context?.user?.name }
    />
  );
}
