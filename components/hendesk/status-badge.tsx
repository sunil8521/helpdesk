import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  ai: "bg-brand/10 text-brand ring-brand/20",
  human: "bg-emerald/10 text-emerald ring-emerald/20",
  waiting: "bg-amber/15 text-amber-foreground ring-amber/30",
  resolved: "bg-muted text-muted-foreground ring-border",
  uploaded: "bg-muted text-muted-foreground ring-border",
  processing: "bg-amber/15 text-amber-foreground ring-amber/30",
  chunked: "bg-brand/10 text-brand ring-brand/20",
  embedding: "bg-brand/10 text-brand ring-brand/20",
  completed: "bg-emerald/10 text-emerald ring-emerald/20",
  failed: "bg-destructive/10 text-destructive ring-destructive/20",
  running: "bg-brand/10 text-brand ring-brand/20",
  online: "bg-emerald/10 text-emerald ring-emerald/20",
  away: "bg-amber/15 text-amber-foreground ring-amber/30",
  offline: "bg-muted text-muted-foreground ring-border",
};

const labels: Record<string, string> = {
  ai: "AI",
  human: "Human",
  waiting: "Waiting",
  resolved: "Resolved",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase();
  const cls = map[key] ?? "bg-muted text-muted-foreground ring-border";
  const label = labels[key] ?? status;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", cls, className)}>
      {key === "ai" && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
      {key === "human" && <span className="h-1.5 w-1.5 rounded-full bg-emerald" />}
      {key === "waiting" && <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />}
      {key === "online" && <span className="h-1.5 w-1.5 rounded-full bg-emerald" />}
      {key === "away" && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
      {label}
    </span>
  );
}
