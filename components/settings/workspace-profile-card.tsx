"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { SettingsCard } from "./settings-card";
import { updateWorkspaceSettingsAction } from "@/app/actions/settings";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";

interface WorkspaceProfileCardProps {
  initialWorkspace: {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    plan: string;
  };
  role?: string;
}

export function WorkspaceProfileCard({ initialWorkspace, role }: WorkspaceProfileCardProps) {
  const isOwner = role === "owner";
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState(initialWorkspace.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await updateWorkspaceSettingsAction({ name: workspaceName });
      if (res.error) throw new Error(res.error);

      setSaved(true);
      toast.add({ title: "Profile Saved", description: "Workspace name updated successfully.", type: "success" });
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (err: any) {
      toast.add({ title: "Error", description: err?.message || "Failed to update profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsCard title="Workspace Profile" desc="General business identity and display name" icon={Building2}>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[13.5px] font-semibold">Workspace Name</Label>
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Co."
            disabled={!isOwner}
            className="h-11 rounded-xl bg-background border-border/50 text-[14px]"
          />
          <p className="text-[12px] text-foreground/45">
            This name will be displayed in your customer portal, widget header, and support emails.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
          <div>
            <Label className="text-[12.5px] font-semibold text-foreground/50">Workspace ID</Label>
            <div className="font-mono text-[13px] font-bold text-foreground mt-0.5">{initialWorkspace.workspaceId}</div>
          </div>
          <div>
            <Label className="text-[12.5px] font-semibold text-foreground/50">Current Plan</Label>
            <div className="text-[13px] font-bold text-brand uppercase mt-0.5">{initialWorkspace.plan} Plan</div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/30">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving || !workspaceName.trim() || !isOwner}
            title={!isOwner ? "Only workspace owners can update settings" : undefined}
            className={`h-10 px-5 rounded-xl bg-brand text-white font-bold shadow-md shadow-brand/20 transition-all ${!isOwner ? 'cursor-not-allowed opacity-50' : 'hover:bg-brand/90 cursor-pointer'}`}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Profile...</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 text-white" /> Profile Saved</>
            ) : (
              "Save Workspace Profile"
            )}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
