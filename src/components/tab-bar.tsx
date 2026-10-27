"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FilePlus2, FileSpreadsheet, FolderPlus, Home, Layers, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { BottomSheet, SheetAction } from "@/components/bottom-sheet";
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
  const [adding, setAdding] = useState(false);
  // On a deck page, "Thêm từ" adds straight into that deck.
  const deckId = path.match(/^\/decks\/([a-f0-9]{24})/)?.[1];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(28px,calc(env(safe-area-inset-bottom)+8px))]">
      <div className="mx-auto flex max-w-md items-end justify-between gap-3 px-5">
        <nav aria-label="Điều hướng chính" style={{ viewTransitionName: "tab-bar" }} className="pointer-events-auto flex h-16 items-center gap-2 rounded-full border border-border bg-popover p-1.5 shadow-nav">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                transitionTypes={["nav-tab"]}
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
        <button
          type="button"
          aria-label="Thêm từ, bộ từ hoặc nhập CSV"
          onClick={() => setAdding(true)}
          className="pointer-events-auto grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-nav outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Plus className="size-[26px]" strokeWidth={2} aria-hidden />
        </button>
        <BottomSheet open={adding} onOpenChange={setAdding} title="Thêm mới">
          <div className="flex flex-col pb-2" onClick={() => setAdding(false)}>
            <SheetAction href={deckId ? `/words/new?deck=${deckId}` : "/words/new"} icon={<FilePlus2 strokeWidth={1.75} />}>
              Thêm từ
            </SheetAction>
            <SheetAction href={deckId ? `/decks/new?parent=${deckId}` : "/decks/new"} icon={<FolderPlus strokeWidth={1.75} />}>
              {deckId ? "Thêm bộ con" : "Tạo bộ từ"}
            </SheetAction>
            {/* Import needs a target deck; from elsewhere the library is where you pick one. */}
            <SheetAction href={deckId ? `/decks/${deckId}/import` : "/decks"} icon={<FileSpreadsheet strokeWidth={1.75} />}>
              Nhập nhiều từ
            </SheetAction>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
