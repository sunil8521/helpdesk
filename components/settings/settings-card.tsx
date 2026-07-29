import React from "react";

export function SettingsCard({
  title,
  desc,
  icon: Icon,
  children,
  danger,
}: {
  title: string;
  desc?: string;
  icon?: any;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-3xl border ${danger ? "border-red-200 bg-red-50/30" : "border-border/50 bg-card"} shadow-2xs overflow-hidden`}>
      <div className="px-6 py-4.5 border-b border-border/40 flex items-center justify-between">
        <div>
          <h3 className={`font-bold text-[16px] tracking-tight flex items-center gap-2 ${danger ? "text-red-700" : "text-foreground"}`}>
            {Icon && <Icon className={`h-4.5 w-4.5 ${danger ? "text-red-600" : "text-brand"}`} />}
            {title}
          </h3>
          {desc && <p className="mt-0.5 text-[12.5px] text-foreground/45">{desc}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
