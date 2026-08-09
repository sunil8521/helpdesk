export default function InboxPage() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl text-muted-foreground">💬</span>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground/80">No Conversation Selected</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Select a conversation from the sidebar to view messages and respond to users.
        </p>
      </div>

      <aside className="hidden lg:flex flex-col h-full border-l border-border/40 bg-card overflow-y-auto p-5 select-none scrollbar-none items-center justify-center">
        <p className="text-[13px] text-foreground/40">Select a conversation</p>
      </aside>
    </>
  );
}
