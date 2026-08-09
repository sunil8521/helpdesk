import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Workspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { UserHeaderSection } from "@/components/onboarding/user-header-section";
import { redirect } from "next/navigation";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.985_0.003_260)] font-sans">
          <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
          <p className="text-foreground/50 text-[14px]">Loading...</p>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}

async function OnboardingPageContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  await connectToDatabase();

  const userId = (session.user as any)?.id;
  const userDoc = userId ? await User.findById(userId) : null;

  // Resolve workspace from DB — never from cookies
  let workspaceId = "";
  if (userId) {
    const membership = await WorkspaceMember.findOne({ userId });
    if (membership) {
      const workspace = await Workspace.findById(membership.workspaceId);
      if (workspace) {
        workspaceId = workspace.workspaceId;
      }
    }
  }

  const userName = userDoc?.name ?? session?.user?.name ?? "";
  const avatarUrl = userDoc?.avatarUrl ?? session?.user?.image ?? "";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex flex-col selection:bg-brand/20">
      {/* ── Top Header matching Landing Page header dimensions & style ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 h-[68px] sm:h-[72px] flex items-center justify-between">
          <Link href="/" className="shrink-0"><HelpdeskLogo /></Link>

          <div className="flex items-center gap-4 sm:gap-6">


            {/* User Avatar, Name & Log out Button */}
            <UserHeaderSection
              userName={userName}
              userEmail={session.user.email as string}
              avatarUrl={avatarUrl}
              userInitials={userInitials}
            />
          </div>
        </div>
      </header>

      {/* ── Client Onboarding Wizard ── */}
      <main className="flex-1">
        <OnboardingWizard workspaceId={workspaceId} />
      </main>
    </div>
  );
}
