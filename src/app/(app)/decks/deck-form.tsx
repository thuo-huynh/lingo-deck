"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const COLORS = ["#E0663F", "#EE9A4D", "#D3A13A", "#3FA36F", "#4A86E8", "#8B6CD9", "#D9649B", "#7B8494"];

type Values = { name: string; description?: string; parentId: string; color?: string };

export function DeckForm({ deckId, decks, initial }: { deckId?: string; decks: { id: string; name: string; depth: number }[]; initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { name: v.name, description: v.description, parentId: v.parentId || null, color: v.color };
      const id = deckId
        ? (await api(`/decks/${deckId}`, { method: "PATCH", body }), deckId)
        : (await api<{ id: string }>("/decks", { body })).id;
      router.replace(`/decks/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-lg" className="-ml-2 size-11" aria-label="Đóng" onClick={() => router.back()}>
          <X className="size-6" strokeWidth={1.75} />
        </Button>
        <h1 className="text-2xl font-semibold">{deckId ? "Sửa bộ từ" : "Tạo bộ từ"}</h1>
      </div>
      <Field label="Tên bộ từ">
        <input required maxLength={80} autoFocus={!deckId} className={inputClass} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Ví dụ: Daily Life" />
      </Field>
      <Field label="Nằm trong">
        <select className={inputClass} value={v.parentId} onChange={(e) => setV({ ...v, parentId: e.target.value })}>
          <option value="">— Bộ từ gốc —</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {"  ".repeat(d.depth)}
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mô tả (không bắt buộc)">
        <textarea maxLength={500} rows={2} className={cn(inputClass, "h-auto py-3")} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] leading-[18px] font-medium text-body">Màu</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Màu ${c}`}
              aria-pressed={v.color === c}
              onClick={() => setV({ ...v, color: c })}
              className={cn("grid size-11 place-items-center rounded-full border", v.color === c ? "border-foreground" : "border-transparent")}
            >
              <span className="size-5 rounded-full" style={{ background: c }} />
            </button>
          ))}
        </div>
      </fieldset>
      <p role="alert" className="min-h-[18px] text-[13px] text-destructive">{error}</p>
      <Button type="submit" size="xl" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        {deckId ? "Lưu thay đổi" : "Tạo bộ từ"}
      </Button>
    </form>
  );
}
