"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface UserHeaderSectionProps {
  userName: string;
  avatarUrl?: string;
  userInitials: string;
}

export function UserHeaderSection({ userName, avatarUrl, userInitials }: UserHeaderSectionProps) {
  return (
    <div className="flex items-center gap-3.5 sm:gap-5">
      {/* Avatar & Name Display */}
      <div className="flex items-center gap-2.5">
        <Avatar className="h-9 w-9 border border-border/60 shadow-xs">
          <AvatarImage src={avatarUrl} alt={userName} />
          <AvatarFallback className="bg-amber-500 text-white font-bold text-[12.5px]">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        {userName && (
          <span className="text-[14px] font-bold text-foreground tracking-tight">
            {userName}
          </span>
        )}
      </div>

      {/* Visible Logout Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-full h-8 px-3 text-[12px] font-semibold border-border/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Log out</span>
      </Button>
    </div>
  );
}
