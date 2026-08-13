"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./settings-card";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { deleteWorkspaceAction } from "@/app/actions/settings";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export function DangerZoneCard({ role }: { role?: string }) {
  const isOwner = role === "owner";
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteWorkspaceAction();
      if (res.error) {
        toast.add({ title: "Error", description: res.error, type: "error" });
        setIsDeleting(false);
        setOpen(false);
      } else {
        toast.add({ title: "Success", description: "Workspace deleted successfully", type: "success" });
        await signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      toast.add({ title: "Error", description: "Failed to delete workspace", type: "error" });
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <SettingsCard title="Danger Zone" desc="Destructive workspace operations" icon={AlertTriangle} danger>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-[14.5px] text-red-800">Delete Workspace</div>
          <p className="text-[12.5px] text-red-600/70">Permanently delete workspace, all conversations, and trained vector data.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button 
              variant="destructive" 
              disabled={!isOwner || isDeleting}
              title={!isOwner ? "Only workspace owners can delete the workspace" : undefined}
              className={`rounded-full h-10 px-5 text-[13px] font-bold shadow-xs shrink-0 ${!isOwner || isDeleting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Workspace
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Workspace?</DialogTitle>
              <DialogDescription className="mt-2">
                Are you absolutely sure you want to delete this workspace? This action cannot be undone and will permanently delete all associated data including AI Agents, Knowledge Base, and Messages.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <DialogClose render={
                <Button variant="outline" disabled={isDeleting} className="rounded-full">Cancel</Button>
              } />
              <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isDeleting} className="rounded-full">
                {isDeleting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </SettingsCard>
  );
}
