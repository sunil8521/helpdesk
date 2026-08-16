import { Suspense } from "react";
import { getTeamMembers } from "@/app/queries/team";
import { TeamClientView } from "@/components/team/team-client-view";
import { TeamSkeleton } from "@/components/team/team-skeleton";

export const metadata = {
  title: "Team & Permissions",
  description: "Manage team members, roles, and handoff permissions.",
};

async function TeamDataStreamer() {
  const res = await getTeamMembers();

  if (!res.success) {
    return (
      <div className="p-8 text-center space-y-3 font-sans">
        <p className="text-red-500 font-semibold text-base">Failed to load team members</p>
        <p className="text-sm text-foreground/60">{res.error || "Could not fetch workspace membership information."}</p>
      </div>
    );
  }

  return <TeamClientView members={res.members} workspaceName={res.workspaceName} role={res.role} />;

}

export default function TeamPage() {
  return (
    <div className="flex-1 w-full h-full">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamDataStreamer />
      </Suspense>
    </div>
  );
}
