"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FilePlus2, FolderPlus, Home, Layers, Plus, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/decks", label: "Bộ từ", icon: Layers },
  { href: "/stats", label: "Thống kê", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

/** Floating pill nav + add button, 28px above the bottom edge (design "Thanh điều hướng nổi"). */
export function TabBar() {
  const path = usePathname();
  // On a deck page, "Thêm từ" adds straight into that deck.
  const deckId = path.match(/^\/decks\/([a-f0-9]{24})/)?.[1];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(28px,calc(env(safe-area-inset-bottom)+8px))]">
      <div className="mx-auto flex max-w-md items-end justify-between gap-3 px-5">
        <nav aria-label="Điều hướng chính" className="pointer-events-auto flex h-16 items-center gap-2 rounded-full border border-border bg-popover p-1.5 shadow-nav">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "grid size-[52px] place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  active ? "bg-nav-active text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </Link>
            );
          })}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Thêm từ, bộ từ hoặc nhập CSV"
            className="pointer-events-auto grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-nav outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Plus className="size-[26px]" strokeWidth={2} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-56">
            <DropdownMenuItem asChild className="min-h-11">
              <Link href={deckId ? `/words/new?deck=${deckId}` : "/words/new"}>
                <FilePlus2 /> Thêm từ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-11">
              <Link href={deckId ? `/decks/new?parent=${deckId}` : "/decks/new"}>
                <FolderPlus /> {deckId ? "Thêm bộ con" : "Tạo bộ từ"}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
