"use client";

import { WorkspaceProfileCard } from "./workspace-profile-card";
import { AISettingsCard } from "./ai-settings-card";
import { DangerZoneCard } from "./danger-zone-card";

interface SettingsClientFormProps {
  initialWorkspace: {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    plan: string;
  };
  initialAgent: {
    id?: string;
    name: string;
    role: string;
    description: string;
    tone: "Friendly" | "Professional" | "Concise" | "Technical";
    responseLength: "Minimalist" | "Standard" | "Detailed";
    aiModel: string;
    temperature: number;
    confidenceThreshold: number;
    humanFallbackBehavior: "escalate" | "cannot";
  };
}

export function SettingsClientForm({ initialWorkspace, initialAgent }: SettingsClientFormProps) {
  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div>
        <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
          Workspace Configuration
        </span>
        <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
          Workspace <em className="font-display not-italic italic text-brand">Settings</em>
        </h1>
        <p className="mt-1 text-[14.5px] text-foreground/50">
          Configure workspace profile, AI engine parameters, and security settings.
        </p>
      </div>

      {/* 1. Workspace Profile Section */}
      <WorkspaceProfileCard initialWorkspace={initialWorkspace} />

      {/* 2. AI Engine Parameters Section */}
      <AISettingsCard initialAgent={initialAgent} />

      {/* 3. Danger Zone Section */}
      <DangerZoneCard />
    </div>
  );
}
