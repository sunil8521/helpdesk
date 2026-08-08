"use client";

import { Button } from "@/components/ui/button";
import { SettingsCard } from "./settings-card";
import { AlertTriangle, Trash2 } from "lucide-react";

export function DangerZoneCard({ role }: { role?: string }) {
  const isOwner = role === "owner";
  return (
    <SettingsCard title="Danger Zone" desc="Destructive workspace operations" icon={AlertTriangle} danger>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-bold text-[14.5px] text-red-800">Delete Workspace</div>
          <p className="text-[12.5px] text-red-600/70">Permanently delete workspace, all conversations, and trained vector data.</p>
        </div>
        <Button 
          variant="destructive" 
          disabled={!isOwner}
          title={!isOwner ? "Only workspace owners can delete the workspace" : undefined}
          className={`rounded-full h-10 px-5 text-[13px] font-bold shadow-xs shrink-0 ${!isOwner ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Workspace
        </Button>
      </div>
    </SettingsCard>
  );
}
