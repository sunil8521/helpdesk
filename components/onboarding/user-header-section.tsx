"use client";

import { UserProfileDropdown } from "@/components/hendesk/user-profile-dropdown";

interface UserHeaderSectionProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  userInitials: string;
}

export function UserHeaderSection({ userName, userEmail, avatarUrl, userInitials }: UserHeaderSectionProps) {
  return (
    <UserProfileDropdown 
      userName={userName} 
      userEmail={userEmail}
      avatarUrl={avatarUrl} 
      userInitials={userInitials} 
    />
  );
}
