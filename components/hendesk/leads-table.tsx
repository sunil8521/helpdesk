"use client";

import { useState } from "react";
import { Search, Mail, Phone, Clock, ArrowUpRight, MessageSquareText } from "lucide-react";
import Link from "next/link";

type Lead = {
  id: string;
  visitorId: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: Date | string;
};

function timeAgo(date: Date | string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}

export function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [search, setSearch] = useState("");

  const validLeads = initialLeads.filter(l =>
    l.name && l.name.trim() !== "" && l.name !== "Anonymous Visitor" &&
    l.email && l.email.trim() !== ""
  );

  const leads = validLeads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
    (l.phone && l.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">All Leads ({validLeads.length})</h2>
          <p className="text-sm text-foreground/50 mt-0.5">Visitors who have provided their contact information.</p>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-card border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-xs uppercase font-semibold text-foreground/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Captured</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-foreground/40" />
                      </div>
                      <p className="font-medium text-foreground">No leads found</p>
                      <p className="text-sm text-foreground/50 max-w-sm">No visitors have provided their contact details yet, or none match your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold tracking-tight text-xs uppercase">
                          {lead.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{lead.name}</div>
                          <div className="text-[12.5px] text-foreground/50 font-mono truncate max-w-[120px]">{lead.visitorId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1.5">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Mail className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Phone className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {!lead.email && !lead.phone && (
                        <span className="text-foreground/40 italic">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground/70">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {timeAgo(lead.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${lead.status === "human" || lead.status === "waiting"
                        ? "bg-amber-500/10 text-amber-600"
                        : lead.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-brand/10 text-brand"
                        }`}>
                        {lead.status === "human" || lead.status === "waiting" ? "Needs Attention" : lead.status === "resolved" ? "Resolved" : "AI Handled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(lead.status === "human" || lead.status === "waiting") && (
                        <Link
                          href={`/dashboard/inbox?c=${lead.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border/50 text-foreground/70 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all shadow-xs"
                        >
                          <MessageSquareText className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
