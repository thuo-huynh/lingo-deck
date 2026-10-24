"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/decks", label: "Bộ từ", icon: Layers },
  { href: "/stats", label: "Thống kê", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pt-2 pb-[max(8px,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 py-1.5 text-[13px] leading-[18px]",
                active ? "font-semibold text-primary" : "font-medium text-muted-foreground"
              )}
            >
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
