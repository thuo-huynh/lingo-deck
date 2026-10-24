import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeckRow({
  href,
  name,
  meta,
  color,
  newCount,
  dueCount,
  first,
  indent = 0,
}: {
  href: string;
  name: string;
  meta?: string;
  color: string;
  newCount: number;
  dueCount: number;
  first?: boolean;
  indent?: number;
}) {
  return (
    <Link
      href={href}
      className={cn("flex min-h-[72px] items-center gap-3 py-3.5 pr-3 active:bg-muted", !first && "border-t border-border")}
      style={{ paddingLeft: 16 + indent * 20 }}
    >
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium">{name}</span>
        {meta && <span className="truncate text-[13px] leading-[18px] text-muted-foreground">{meta}</span>}
      </span>
      <span className="flex gap-3 text-center tabular-nums">
        <span className="flex min-w-8 flex-col">
          <span className={cn("text-base font-semibold", newCount ? "text-primary" : "text-muted-foreground")}>{newCount}</span>
          <span className="text-[13px] leading-[18px] text-muted-foreground">Mới</span>
        </span>
        <span className="flex min-w-8 flex-col">
          <span className={cn("text-base font-semibold", dueCount ? "text-foreground" : "text-muted-foreground")}>{dueCount}</span>
          <span className="text-[13px] leading-[18px] text-muted-foreground">Ôn</span>
        </span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
