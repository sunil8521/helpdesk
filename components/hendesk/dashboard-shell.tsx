"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  Bot,
  Globe,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  MessageSquareCode,
  Menu,
  X,
  Sparkles,
  Command,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { useAppStore } from "@/store/use-workspace-store";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/inbox", label: "Inbox", icon: Inbox, badge: "3" },
  { to: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/dashboard/widget", label: "Widget", icon: MessageSquareCode },
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { currentWorkspace, user } = useAppStore();

  const wsName = currentWorkspace?.name || "Workspace";
  const wsPlan = currentWorkspace?.plan ? `${currentWorkspace.plan} workspace` : "Workspace";
  const wsInitial = wsName[0]?.toUpperCase() || "W";

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userAvatar = user?.avatarUrl;
  const userInitials = userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_260)] flex font-sans selection:bg-brand/20">
      {/* ── Desktop Sidebar Navigation ── */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 h-screen z-30">
        <div className="px-5 h-[72px] flex items-center border-b border-border/40">
          <Link href="/">
            <HelpdeskLogo />
          </Link>
        </div>

        {/* Workspace Selector */}
        <div className="px-3 pt-3">
          <button className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-card px-3 py-2 text-left hover:border-brand/30 transition-all shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-brand text-white grid place-items-center text-[12px] font-bold shrink-0">
                {wsInitial}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-tight truncate text-foreground">{wsName}</div>
                <div className="text-[10.5px] text-foreground/45 truncate capitalize">{wsPlan}</div>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
          </button>
        </div>

        {/* Main Nav Links */}
        <nav className="mt-4 px-3 space-y-1 flex-1 overflow-y-auto scrollbar-none">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                href={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200",
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/15"
                    : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-white" : "text-foreground/50")} />
                <span className="flex-1 truncate">{n.label}</span>
                {n.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
                  )}>
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Credits Widget */}
        <div className="p-3 border-t border-border/40">
          <div className="rounded-2xl bg-card border border-border/50 p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-[12px] font-bold">
              <span className="flex items-center gap-1.5 text-foreground/80">
                <Sparkles className="h-3.5 w-3.5 text-brand" /> AI Credits
              </span>
              <span className="text-brand font-semibold">62%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: "62%" }} />
            </div>
            <div className="text-[11px] text-foreground/45 font-medium">6,200 / 10,000 requests used</div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Matching Landing & Onboarding Dimensions */}
        <header className="sticky top-0 z-40 h-[68px] sm:h-[72px] border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Mobile Logo & Trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-xl text-foreground/70 hover:bg-foreground/[0.05]"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <Link href="/" className="shrink-0"><HelpdeskLogo showText={false} /></Link>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-foreground/35" />
            <input
              placeholder="Search conversations, docs, people…"
              className="w-full pl-10 pr-12 h-10 text-[13.5px] rounded-xl bg-card border border-border/50 text-foreground placeholder:text-foreground/35 outline-none focus:border-brand transition-colors"
            />
            <div className="absolute right-3 top-2.5 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-foreground/40 font-semibold border border-border/40">
              <Command className="h-2.5 w-2.5" /> K
            </div>
          </div>

          {/* Header Right Tools */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative h-10 w-10 rounded-xl bg-card border border-border/50 hover:bg-foreground/[0.04] grid place-items-center transition-colors shadow-2xs">
              <Bell className="h-4.5 w-4.5 text-foreground/60" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full ring-2 ring-transparent hover:ring-brand/30 transition-all outline-none cursor-pointer">
                <Avatar className="h-9.5 w-9.5 border border-border/60 shadow-2xs">
                  {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                  <AvatarFallback className="bg-brand/10 text-brand font-bold text-[12px]">{userInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-border/60">
                <DropdownMenuLabel>
                  <div className="font-bold text-[13.5px]">{userName}</div>
                  <div className="text-[11px] text-foreground/40 font-normal truncate">{userEmail}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem className="rounded-xl cursor-pointer text-[13px]">
                  <Link href="/dashboard" className="w-full">Dashboard Overview</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl cursor-pointer text-[13px]">
                  <Link href="/dashboard/settings" className="w-full">Workspace Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-xl cursor-pointer text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Header Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Log out"
              className="h-9.5 px-3 rounded-full bg-card border border-border/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-foreground/70 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors shadow-2xs cursor-pointer ml-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* Page Children Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-[280px] bg-background h-full p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 pb-3 border-b border-border/40">
                <HelpdeskLogo />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {nav.map((n) => {
                  const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      href={n.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all",
                        active ? "bg-brand text-white" : "text-foreground/70 hover:bg-foreground/[0.04]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1">{n.label}</span>
                      {n.badge && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">{n.badge}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center gap-3 px-2">
                <Avatar className="h-10 w-10">
                  {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                  <AvatarFallback className="bg-brand/10 text-brand font-bold text-[12px]">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[14px] font-bold">{userName}</div>
                  <div className="text-[11.5px] text-foreground/45 truncate">{userEmail}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}
    </div>
  );
}
