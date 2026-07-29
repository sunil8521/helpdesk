"use client";

import { cn } from "@/lib/utils";
import { Headset } from "lucide-react";

export function HelpdeskLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand/80 grid place-items-center shadow-md shadow-brand/20">
        <Headset className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
      </div>
      {showText && <span className="text-[19px] font-bold tracking-[-0.02em] text-foreground">Helpdesk</span>}
    </div>
  );
}
