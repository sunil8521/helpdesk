"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpdeskLogo } from "@/components/hendesk/logo";
import { Menu, X, ArrowRight } from "lucide-react";

interface MobileNavProps {
  items: string[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-xl border border-border/50 bg-card/80 text-foreground/80 hover:text-foreground hover:bg-muted/50 shadow-2xs transition-all"
        aria-label="Toggle Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[68px] sm:top-[72px] bottom-0 bg-background border-t border-border/50 z-[100] p-6 flex flex-col justify-between animate-in fade-in-0 slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="space-y-4">
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-[17px] font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/[0.04] rounded-xl transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-border/40 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full text-center py-3 text-[16px] font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/[0.04] transition-colors"
            >
              Login
            </Link>
            <Button
              asChild
              className="w-full bg-brand text-brand-foreground hover:bg-brand/85 h-12 text-[16px] font-semibold rounded-full shadow-md shadow-brand/15"
            >
              <Link href="/signup" onClick={() => setOpen(false)}>
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
