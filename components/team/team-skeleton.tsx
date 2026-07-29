import { Loader2 } from "lucide-react";

export function TeamSkeleton() {
  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-36 bg-muted rounded-full" />
          <div className="h-9 w-64 bg-muted rounded-xl" />
          <div className="h-4 w-96 bg-muted rounded-lg" />
        </div>
        <div className="h-11 w-40 bg-muted rounded-full" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 space-y-4 shadow-2xs">
        <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-muted/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
