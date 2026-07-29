import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Invite } from "@/lib/db/models/Invite";
import { User } from "@/lib/db/models/User";
import { Workspace } from "@/lib/db/models/Workspace";
import { WorkspaceMember } from "@/lib/db/models/WorkspaceMember";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { InviteSignupForm } from "@/components/auth/invite-signup-form";
import { acceptInviteAction } from "@/app/actions/auth";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function InvitePage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.985_0.003_260)] font-sans">
          <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
          <p className="text-foreground/50 text-[14px]">Verifying invite...</p>
        </div>
      }
    >
      <InvitePageContent token={params.token} />
    </Suspense>
  );
}

async function InvitePageContent({ token }: { token: string }) {
  await connectToDatabase();

  const invite = await Invite.findOne({ token, status: "pending" })
    .populate<{ workspaceId: any }>("workspaceId", "name")
    .lean();

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.985_0.003_260)] font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Invalid or Expired Invite</h2>
          <p className="mt-2 text-foreground/60">This invitation link is no longer valid.</p>
          <Link href="/" className="mt-6 inline-block text-brand font-medium hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.985_0.003_260)] font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Invite Expired</h2>
          <p className="mt-2 text-foreground/60">This invitation has expired. Please ask for a new invite.</p>
        </div>
      </div>
    );
  }

  const workspaceName = invite.workspaceId.name;
  const email = invite.email;

  // Check if a user account already exists with this email
  const existingUser = await User.findOne({ email }).lean();
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block"><HelpdeskLogo /></Link>
        <h2 className="mt-6 text-[28px] font-bold tracking-tight text-foreground">
          Join <em className="font-display not-italic italic text-brand">{workspaceName}</em>
        </h2>
        <p className="mt-2 text-[14px] text-foreground/50">
          You've been invited to join the workspace as an {invite.role}.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {!existingUser ? (
          // New User: Needs to register
          <InviteSignupForm email={email} token={token} />
        ) : (
          // Existing User
          <div className="bg-card py-8 px-6 sm:px-10 rounded-3xl border border-border/50 shadow-xl text-center space-y-6">
            {!session ? (
              // Not logged in
              <>
                <p className="text-[14px] text-foreground/70">
                  An account with <strong>{email}</strong> already exists. Please log in to accept this invitation.
                </p>
                <Link href={`/login?callbackUrl=/invite/${token}`}>
                  <button className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 transition-all mt-4 cursor-pointer">
                    Log in to Accept
                  </button>
                </Link>
              </>
            ) : session.user?.email !== email ? (
              // Logged in with wrong email
              <>
                <p className="text-[14px] text-foreground/70">
                  This invite is for <strong>{email}</strong>, but you are logged in as <strong>{session.user?.email}</strong>.
                </p>
                <p className="text-[14px] text-foreground/70 mt-2">
                  Please log out and log back in with the correct email.
                </p>
              </>
            ) : (
              // Logged in with correct email - can accept directly via server action form
              <form action={async () => {
                "use server";
                await acceptInviteAction(token);
                redirect("/dashboard");
              }}>
                <p className="text-[14px] text-foreground/70">
                  You are logged in as <strong>{email}</strong>.
                </p>
                <button type="submit" className="w-full bg-brand text-white hover:bg-brand/85 rounded-full h-11 text-[15px] font-semibold shadow-md shadow-brand/15 transition-all mt-4 cursor-pointer">
                  Accept Invitation
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
