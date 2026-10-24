"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string; hint?: string };

/** Radio group styled as the design's option cards; arrow keys move the selection. */
export function ChoiceList({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const n = (i + options.length) % options.length;
    onChange(options[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-col gap-3", className)}>
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => {
              const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
              if (delta) {
                e.preventDefault();
                move(i + delta);
              }
            }}
            className={cn(
              "flex min-h-[64px] items-center gap-4 rounded-btn px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
              on ? "border-[1.5px] border-primary bg-primary-soft" : "border border-border-strong bg-card"
            )}
          >
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", on ? "border-2 border-primary" : "border-[1.5px] border-border-strong")}>
              <span className={cn("size-2.5 rounded-full", on ? "bg-primary" : "bg-transparent")} />
            </span>
            <span className="flex flex-col">
              <span className="text-base font-medium">{o.label}</span>
              {o.hint && <span className="text-[13px] leading-[18px] text-muted-foreground">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
