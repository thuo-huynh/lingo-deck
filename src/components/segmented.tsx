"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-btn bg-muted p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-11 rounded-[10px] border text-base transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
              on ? "border-border bg-card font-semibold text-foreground shadow-xs" : "border-transparent font-medium text-muted-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
