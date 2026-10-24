import { cn } from "@/lib/utils";

/** Placeholder block with a soft pulse; shapes mirror the real pages so nothing jumps when data arrives (spec #2). */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-field bg-muted motion-reduce:animate-none", className)} />;
}

export function RowsSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-card", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn("flex min-h-[72px] items-center gap-3 px-4", i && "border-t border-border")}>
          <Bone className="size-2.5 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-3 w-1/4" />
          </div>
          <Bone className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Screen-reader text for every loading state. */
export function LoadingLabel() {
  return (
    <p role="status" className="sr-only">
      Đang tải…
    </p>
  );
}
