import { Suspense } from "react";
import { getPublicWidgetConfigBySlug } from "@/app/queries/widget";
import { getFaqsAction } from "@/app/actions/faq";
import { WidgetEmbedClient } from "@/components/widget/widget-embed-client";

interface EmbedPageProps {
  searchParams: Promise<{ workspaceId?: string; email?: string; name?: string }>;
}

export default function WidgetEmbedPage(props: EmbedPageProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `html, body { background: transparent !important; overflow: hidden !important; width: 100vw; height: 100vh; margin: 0; padding: 0; }` }} />
      <Suspense fallback={null}>
        <WidgetEmbedContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function WidgetEmbedContent({ searchParams }: { searchParams: Promise<{ workspaceId?: string; email?: string; name?: string }> }) {
  const { workspaceId, email, name } = await searchParams;

  if (!workspaceId) {
    return (
      <div className="w-full h-full flex items-end justify-end p-2 font-sans">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-3 text-xs font-semibold">
          Missing Workspace ID
        </div>
      </div>
    );
  }

  const res = await getPublicWidgetConfigBySlug(workspaceId);

  if (!res.success) {
    return (
      <div className="w-full h-full flex items-end justify-end p-2 font-sans">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-3 text-xs font-semibold shadow-sm">
          {res.error || "Workspace not found"}
        </div>
      </div>
    );
  }

  // Serialize Mongoose Documents into plain JSON objects for Client Component
  const config = res.config!
  const agent = res.agent!
  const safeConfig = JSON.parse(JSON.stringify(config));
  const safeAgent = JSON.parse(JSON.stringify(agent));

  const faqs = await getFaqsAction(res.workspaceOid!);

  return (
    <WidgetEmbedClient
      workspaceId={workspaceId!}
      config={safeConfig}
      agent={safeAgent}
      ssoEmail={email}
      ssoName={name}
      initialFaqs={faqs}
    />
  );
}
