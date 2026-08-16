"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function ForceSignOut() {
  useEffect(() => {
    toast.add({ 
      title: "Session Expired", 
      description: "Your workspace could not be found. Please log in again.", 
      type: "error" 
    });
    
    // Slight delay to allow toast to render
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
        <p className="text-sm text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  );
}
