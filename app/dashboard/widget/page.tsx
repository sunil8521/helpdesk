import { getWidgetConfig } from "@/app/queries/widget";
import { getFaqs } from "@/app/queries/faq";
import { WidgetClientView } from "@/components/widget/widget-client-view";
import { redirect } from "next/navigation";
import { resolveUserWorkspace } from "@/lib/auth/resolve-context";

export const metadata = {
  title: "Widget Customization",
  description: "Customize and embed your Helpdesk AI widget",
};

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function WidgetDataStreamer() {
  const ctx = await resolveUserWorkspace();
  if (!ctx) redirect("/login");

  const res = await getWidgetConfig(ctx.workspace._id.toString(), ctx.workspace.workspaceId);
  const initialFaqs = await getFaqs(ctx.workspace._id.toString());

  if (!res.success) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-500 font-semibold text-base">Failed to load widget configuration</p>
        <p className="text-sm text-foreground/60">{res.error || "Widget config not found."}</p>
      </div>
    );
  }

  return (
    <WidgetClientView
      initialConfig={res.config}
      workspaceId={res.workspaceId!}
      agentInfo={res.agentInfo}
      role={ctx.role}
      initialFaqs={initialFaqs}
    />
  );
}

export default function WidgetPage() {
  return (
    <div className="flex-1 w-full h-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        }
      >
        <WidgetDataStreamer />
      </Suspense>
    </div>
  );
}
