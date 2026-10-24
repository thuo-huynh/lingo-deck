"use client";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionView } from "@/features/study/view";

export function Summary({ summary }: { summary: SessionView["summary"] }) {
  const s = summary;
  const firstTry = s && s.remembered + s.forgotten ? Math.round((s.remembered / (s.remembered + s.forgotten)) * 100) : 0;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(96px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <PartyPopper className="size-8" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Xong buổi học</h1>
        {s && <p className="mt-1 text-body">{s.rescheduleMode === "scheduled" ? "Ôn theo lịch" : "Luyện tập · không đổi lịch ôn"}</p>}
      </div>
      {s && (
        <>
          <div className="mt-8 grid grid-cols-3 gap-3 tabular-nums">
            <Tile value={String(s.finishedWords)} label="từ đã học" />
            <Tile value={`${firstTry}%`} label="đúng lần đầu" />
            <Tile value={`+${s.xp}`} label="XP" />
          </div>
          {s.forgotten > 0 && (
            <p className="mt-6 text-center text-body">
              {s.forgotten} từ sẽ quay lại sớm để ôn. Sai là một phần của việc nhớ lâu!
            </p>
          )}
        </>
      )}
      <div className="flex-1" />
      <Button asChild size="xl">
        <Link href="/">Xong</Link>
      </Button>
    </main>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-card px-2 py-4">
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-[13px] leading-[18px] text-muted-foreground">{label}</span>
    </div>
  );
}
