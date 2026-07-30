"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

interface UserProfileDropdownProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  userInitials: string;
}

export function UserProfileDropdown({ userName, userEmail, avatarUrl }: UserProfileDropdownProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ring-2 ring-transparent hover:ring-brand/30 transition-all outline-none cursor-pointer">
        <div className="h-9.5 w-9.5 relative overflow-hidden shrink-0 shadow-2xs bg-slate-100 border border-border/40">
          <Image
            src={avatarUrl!}
            alt={"Profile_Picture"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-border/60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 py-2 px-2">
            <div className="h-10 w-10 relative overflow-hidden shrink-0 bg-slate-100 border border-border/40">
              <Image
                src={avatarUrl!}
                alt={"Profile_Picture"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col space-y-0.5 min-w-0">
              <p className="text-[13.5px] font-bold leading-none truncate text-foreground">{userName}</p>
              <p className="text-[11px] text-foreground/50 font-medium truncate">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 border-border/40" />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-xl cursor-pointer text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-semibold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
