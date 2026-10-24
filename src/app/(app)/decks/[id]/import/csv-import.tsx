"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, Copy, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { ImportRow } from "@/features/vocab/csv";

const SAMPLE =
  "term,meaning_vi,example,example_vi,phonetic,tags\r\napple,quả táo,I eat an apple every morning.,Tôi ăn một quả táo mỗi sáng.,/ˈæp.əl/,food;A1\r\n";

export function CsvImport({ deckId, deckName, deckColor }: { deckId: string; deckName: string; deckColor: string }) {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = rows?.filter((r) => r.status === "ok").length ?? 0;
  const dup = rows?.filter((r) => r.status === "duplicate").length ?? 0;
  const bad = rows?.filter((r) => r.status === "error").length ?? 0;

  async function pick(f: File) {
    setBusy(true);
    setError(null);
    try {
      const text = await f.text();
      const res = await api<{ rows: ImportRow[] }>(`/decks/${deckId}/import`, { body: { csv: text } });
      setFile({ name: f.name, text });
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được file");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    try {
      const res = await api<{ imported: number }>(`/decks/${deckId}/import`, { body: { csv: file.text, commit: true } });
      toast.success(`Đã nhập ${res.imported} từ`);
      router.replace(`/decks/${deckId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không nhập được");
      setBusy(false);
    }
  }

  const filePicker = (label: React.ReactNode, className?: string, variant?: "link") => (
    <label className={cn(variant === "link" ? "cursor-pointer py-3 text-[13px] font-semibold text-primary" : className)}>
      {label}
      <input type="file" accept=".csv,text/csv" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </label>
  );

  return (
    <main className="flex min-h-[calc(100dvh-180px)] flex-col">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-lg" className="-ml-2 size-11">
          <Link href={`/decks/${deckId}`} transitionTypes={["nav-back"]} aria-label="Quay lại"><ChevronLeft className="size-6" strokeWidth={1.75} /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nhập từ CSV</h1>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-btn border border-border bg-card px-4 py-3">
        <span className="text-[13px] font-medium text-body">Nhập vào</span>
        <span className="flex items-center gap-2 font-medium">
          <span className="size-2.5 rounded-full" style={{ background: deckColor }} aria-hidden />
          {deckName}
        </span>
      </div>

      {!rows ? (
        <>
          <div className="mt-6 flex flex-col items-center gap-2 rounded-card border-[1.5px] border-dashed border-border-strong bg-card px-6 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><FileSpreadsheet className="size-6" strokeWidth={1.75} aria-hidden /></span>
            <p className="mt-2 font-medium">Chọn một file .csv</p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              Cột bắt buộc: <code className="font-semibold text-foreground">term</code>, <code className="font-semibold text-foreground">meaning_vi</code>
              <br />
              Không bắt buộc: example, example_vi, phonetic, part_of_speech, tags, accepted
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + SAMPLE)}`}
            download="lingodeck-mau.csv"
            className="mx-auto mt-3 py-3 text-[13px] font-semibold text-primary"
          >
            Tải file mẫu
          </a>
          <p role="alert" className="min-h-[18px] text-center text-[13px] text-destructive">{error}</p>
          <div className="flex-1" />
          {filePicker(
            <>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" strokeWidth={1.75} />} Chọn file
            </>,
            "flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-btn bg-primary text-base font-semibold text-primary-foreground"
          )}
        </>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3 rounded-btn border border-border bg-card px-4 py-3">
            <FileSpreadsheet className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{file?.name}</span>
              <span className="text-[13px] text-muted-foreground tabular-nums">{rows.length} dòng</span>
            </span>
            {filePicker("Đổi file", undefined, "link")}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-semibold tabular-nums">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-good-soft px-3 text-good"><Check className="size-4" aria-hidden />{ok} hợp lệ</span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-hard-soft px-3 text-hard"><Copy className="size-4" aria-hidden />{dup} trùng</span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-again-soft px-3 text-again"><AlertTriangle className="size-4" aria-hidden />{bad} lỗi</span>
          </div>
          <div role="table" aria-label="Xem trước dữ liệu" className="mt-4 overflow-hidden rounded-card border border-border bg-card text-[15px]">
            <div role="row" className="grid grid-cols-[36px_1fr_1fr_28px] gap-2 border-b border-border px-4 py-2 text-[13px] font-medium text-muted-foreground">
              <span role="columnheader">#</span>
              <span role="columnheader">Từ</span>
              <span role="columnheader">Nghĩa</span>
              <span role="columnheader"><span className="sr-only">Trạng thái</span></span>
            </div>
            {rows.map((r) => (
              <div key={r.line} role="row" className={cn("border-t border-border px-4 py-2.5 first-of-type:border-t-0", r.status === "error" && "bg-again-soft", r.status === "duplicate" && "bg-hard-soft")}>
                <div className="grid grid-cols-[36px_1fr_1fr_28px] items-center gap-2">
                  <span role="cell" className="text-[13px] text-muted-foreground tabular-nums">{r.line}</span>
                  <span role="cell" className="truncate font-medium">{r.term || "(trống)"}</span>
                  <span role="cell" className={cn("truncate", !r.meaningVi && "text-muted-foreground")}>{r.meaningVi || "(trống)"}</span>
                  <span role="cell" className="flex justify-end">
                    {r.status === "error" && <AlertTriangle className="size-4 text-again" role="img" aria-label="Lỗi" />}
                    {r.status === "duplicate" && <Copy className="size-4 text-hard" role="img" aria-label="Trùng" />}
                  </span>
                </div>
                {r.note && <p className={cn("mt-1 pl-11 text-[13px] leading-[18px]", r.status === "error" ? "text-again" : "text-hard")}>{r.note}</p>}
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="sticky bottom-[calc(108px+env(safe-area-inset-bottom))] -mx-6 mt-4 flex flex-col gap-2 border-t border-border bg-background px-6 py-3">
            {(dup > 0 || bad > 0) && <p className="text-center text-[13px] text-muted-foreground">Dòng lỗi và dòng trùng sẽ được bỏ qua.</p>}
            <Button size="xl" disabled={busy || ok === 0} onClick={commit}>
              {busy && <Loader2 className="animate-spin" />}
              Nhập {ok} từ
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
