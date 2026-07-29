"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/hendesk/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserPlus,
  MoreHorizontal,
  Users,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Mail,
  Sparkles,
} from "lucide-react";

import { FormattedTeamMember } from "@/app/queries/team";
import { inviteTeamMemberAction } from "@/app/actions/team";

export type { FormattedTeamMember as TeamMemberItem };

interface TeamClientViewProps {
  members: FormattedTeamMember[];
  workspaceName: string;
}

export function TeamClientView({ members, workspaceName }: TeamClientViewProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invited, setInvited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setError("");
    setIsLoading(true);

    try {
      const res = await inviteTeamMemberAction(inviteEmail, inviteRole as "owner" | "admin" | "agent");
      if (!res.success) {
        setError(res.error || "Failed to send invite");
      } else {
        setInvited(true);
        setTimeout(() => {
          setInvited(false);
          setInviteEmail("");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand bg-brand/8 px-3 py-1 rounded-full">
            Human Handoff Network
          </span>
          <h1 className="mt-2.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Team &amp; <em className="font-display not-italic italic text-brand">Permissions</em>
          </h1>
          <p className="mt-1 text-[14.5px] text-foreground/50">
            Manage human agents, assign conversation roles, and configure handoff preferences.
          </p>
        </div>

        <Button className="bg-brand text-white hover:bg-brand/85 rounded-full h-11 px-6 font-semibold text-[14px] shadow-md shadow-brand/15 cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" /> Invite Teammate
        </Button>
      </div>

      {/* KPI Cards (Commented out per user request - do not remove) */}
      {/*
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Team Members</span>
            <Users className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">5 Agents</div>
          <div className="mt-1 text-[11.5px] font-medium text-emerald flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> 4 online now
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Active Seats</span>
            <Headphones className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">4 / 5 Seats</div>
          <div className="mt-1 text-[11.5px] font-medium text-foreground/40">Pro Plan (1 seat open)</div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Avg Handoff Speed</span>
            <Sparkles className="h-4 w-4 text-amber" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">1m 48s</div>
          <div className="mt-1 text-[11.5px] font-medium text-emerald flex items-center gap-1">
            Fast response
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-foreground/45">Satisfaction Score</span>
            <ShieldCheck className="h-4 w-4 text-emerald" />
          </div>
          <div className="mt-2.5 text-[24px] font-bold tracking-tight">98.4%</div>
          <div className="mt-1 text-[11.5px] font-medium text-emerald flex items-center gap-1">
            Based on 212 ratings
          </div>
        </div>
      </div>
      */}

      {/* Team Members Table */}
      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xs">
        <div className="px-6 py-4.5 border-b border-border/40 flex items-center justify-between bg-card">
          <h3 className="font-bold text-[16px] tracking-tight">Active Agents &amp; Roles</h3>
          <span className="text-[12px] font-semibold text-foreground/40">Workspace: {workspaceName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[oklch(0.985_0.003_260)] text-[11.5px] uppercase tracking-wider text-foreground/40 font-semibold border-b border-border/40">
              <tr>
                <th className="text-left font-semibold px-6 py-3.5">Member</th>
                <th className="text-left font-semibold px-6 py-3.5">Email</th>
                <th className="text-left font-semibold px-6 py-3.5">Role</th>
                <th className="text-left font-semibold px-6 py-3.5">Status</th>
                <th className="text-left font-semibold px-6 py-3.5">Joined</th>
                <th className="w-12 px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand/10 text-brand font-bold text-[12px] grid place-items-center shrink-0 overflow-hidden">
                        {m.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatarUrl} alt={m.name || "Member"} className="h-full w-full object-cover" />
                        ) : (
                          (m.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("")
                        )}
                      </div>
                      <span className="font-bold text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/50 font-medium">{m.email}</td>
                  <td className="px-6 py-4">
                    <Select defaultValue={m.role}>
                      <SelectTrigger className="h-8 rounded-lg text-[12.5px] font-semibold w-28 bg-background border-border/50 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg min-w-[120px]">
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={m.status === "online" ? "Active" : m.status === "in_chat" ? "In Chat" : "Offline"} />
                  </td>
                  <td className="px-6 py-4 text-foreground/40 font-medium text-[12.5px]">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-foreground/[0.05] text-foreground/40 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Invite Box */}
      <div className="rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-br from-card via-[oklch(0.985_0.003_260)] to-card p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="max-w-md">
          <h3 className="font-bold text-[18px] tracking-tight">Invite Teammate via Email</h3>
          <p className="text-[13px] text-foreground/50 mt-1">
            Invited agents receive an instant access link to join human handoffs.
          </p>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="agent@company.com"
              className="pl-10 h-11 rounded-xl text-[14px] bg-background border-border/50"
            />
          </div>

          <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "agent")}>
            <SelectTrigger className="h-11 rounded-xl text-[13.5px] font-semibold w-32 bg-background border-border/50 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg min-w-[120px]">
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="submit"
            disabled={isLoading || invited}
            className="bg-brand text-white hover:bg-brand/85 rounded-full h-11 px-7 font-semibold text-[14px] shadow-sm cursor-pointer shrink-0 disabled:opacity-70"
          >
            {isLoading ? (
              "Sending..."
            ) : invited ? (
              <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Invite Sent!</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-1.5" /> Send Invite</>
            )}
          </Button>
        </form>
        {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}
      </div>
    </div>
  );
}
