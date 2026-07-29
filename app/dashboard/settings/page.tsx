import { Suspense } from "react";
import { getWorkspaceAndAgentSettings } from "@/app/queries/settings";
import { SettingsClientForm } from "@/components/settings/settings-client-form";

function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse font-sans">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded-full" />
        <div className="h-8 w-64 bg-muted rounded-xl" />
        <div className="h-4 w-96 bg-muted/60 rounded-md" />
      </div>
      <div className="h-48 bg-card rounded-3xl border border-border/40 p-6" />
      <div className="h-64 bg-card rounded-3xl border border-border/40 p-6" />
    </div>
  );
}

async function SettingsDataStreamer() {
  // NEXT 16 BEST PRACTICE: Fetch parallel queries directly via Server Component data access layer!
  const { workspace, agent } = await getWorkspaceAndAgentSettings();

  return <SettingsClientForm initialWorkspace={workspace} initialAgent={agent} />;
}

export default async function SettingsPage() {
  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-4xl mx-auto">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsDataStreamer />
      </Suspense>
    </div>
  );
}
