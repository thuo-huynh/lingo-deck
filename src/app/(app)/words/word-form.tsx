"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Play, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import { api } from "@/lib/client-api";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export type WordValues = {
  deckId: string;
  term: string;
  meaningVi: string;
  languageCode: string;
  partOfSpeech?: string;
  phonetic?: string;
  acceptedAnswers: string[];
  examples: { text: string; translationVi?: string }[];
  hints: { type: "custom" | "first_letter" | "letter_count"; value: string }[];
  tags: string[];
  notes?: string;
  audioKey?: string;
};

export function WordForm({
  wordId,
  initial,
  decks,
}: {
  wordId?: string;
  initial: WordValues;
  decks: { id: string; name: string; color: string; depth: number }[];
}) {
  const router = useRouter();
  const [v, setV] = useState<WordValues>(initial);
  const hasDetails = !!(initial.phonetic || initial.examples.length || initial.hints.length || initial.tags.length || initial.audioKey || initial.notes);
  const [expanded, setExpanded] = useState(hasDetails);
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const example = v.examples[0] ?? { text: "", translationVi: "" };
  const hint = v.hints.find((h) => h.type === "custom")?.value ?? "";
  const deck = decks.find((d) => d.id === v.deckId);

  async function upload(file: File) {
    setUploading(true);
    try {
      const { key, uploadUrl } = await api<{ key: string; uploadUrl: string }>("/media/upload-url", {
        body: { contentType: file.type, size: file.size },
      });
      const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Tải lên thất bại");
      setV((x) => ({ ...x, audioKey: key }));
      toast.success("Đã tải âm thanh lên");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent, addAnother = false) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      ...v,
      examples: v.examples.filter((x) => x.text.trim()),
      hints: v.hints.filter((x) => x.value.trim()),
      acceptedAnswers: v.acceptedAnswers.filter((x) => x.trim()),
    };
    try {
      if (wordId) await api(`/vocabulary/${wordId}`, { method: "PUT", body });
      else await api("/vocabulary", { body });
      if (addAnother) {
        toast.success(`Đã lưu “${v.term}”`);
        setV({ ...initial, deckId: v.deckId, languageCode: v.languageCode });
        setBusy(false);
        document.getElementById("term")?.focus();
        return;
      }
      router.replace(`/decks/${v.deckId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => save(e)} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-lg" className="-ml-2 size-11" aria-label="Đóng" onClick={() => router.back()}>
          <X className="size-6" strokeWidth={1.75} />
        </Button>
        <h1 className="text-2xl font-semibold">{wordId ? "Sửa từ" : "Thêm từ"}</h1>
      </div>

      <Field label="Lưu vào">
        <span className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 size-2.5 -translate-y-1/2 rounded-full" style={{ background: deck?.color }} />
          <select className={cn(inputClass, "pl-9")} value={v.deckId} onChange={(e) => setV({ ...v, deckId: e.target.value })}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {"  ".repeat(d.depth)}
                {d.name}
              </option>
            ))}
          </select>
        </span>
      </Field>
      <Field label="Từ">
        <input id="term" required maxLength={200} autoFocus={!wordId} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={inputClass} placeholder="Ví dụ: apple" value={v.term} onChange={(e) => setV({ ...v, term: e.target.value })} />
      </Field>
      <Field label="Nghĩa tiếng Việt">
        <input required maxLength={500} autoComplete="off" className={inputClass} placeholder="Ví dụ: quả táo" value={v.meaningVi} onChange={(e) => setV({ ...v, meaningVi: e.target.value })} />
      </Field>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[64px] items-center gap-3 rounded-btn border border-border bg-card px-4 py-3 text-left"
      >
        <span className="flex flex-1 flex-col">
          <span className="font-medium">Thêm chi tiết</span>
          <span className="text-[13px] leading-[18px] text-muted-foreground">Phiên âm, ví dụ, gợi ý, âm thanh, tag · không bắt buộc</span>
        </span>
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", expanded && "rotate-180")} strokeWidth={1.75} />
      </button>

      {expanded && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phiên âm">
              <input maxLength={100} className={inputClass} placeholder="/ˈæp.əl/" value={v.phonetic ?? ""} onChange={(e) => setV({ ...v, phonetic: e.target.value })} />
            </Field>
            <Field label="Từ loại">
              <input maxLength={40} className={inputClass} placeholder="noun" value={v.partOfSpeech ?? ""} onChange={(e) => setV({ ...v, partOfSpeech: e.target.value })} />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Câu ví dụ</span>
            <input aria-label="Câu ví dụ" maxLength={500} className={inputClass} placeholder="I eat an apple every morning." value={example.text} onChange={(e) => setV({ ...v, examples: [{ ...example, text: e.target.value }] })} />
            <input aria-label="Bản dịch câu ví dụ" maxLength={500} className={inputClass} placeholder="Bản dịch: Tôi ăn một quả táo mỗi sáng." value={example.translationVi ?? ""} onChange={(e) => setV({ ...v, examples: [{ ...example, translationVi: e.target.value }] })} />
          </div>
          <Field label="Gợi ý">
            <input maxLength={300} className={inputClass} placeholder="Một loại trái cây màu đỏ hoặc xanh" value={hint} onChange={(e) => setV({ ...v, hints: e.target.value ? [{ type: "custom", value: e.target.value }] : [] })} />
          </Field>
          <Field label="Cách viết khác được chấp nhận" hint="Phân tách bằng dấu phẩy, ví dụ: color, colour">
            <input maxLength={500} className={inputClass} value={v.acceptedAnswers.filter((a) => a !== v.term).join(", ")} onChange={(e) => setV({ ...v, acceptedAnswers: e.target.value.split(",").map((s) => s.trim()) })} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Âm thanh</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" className="h-11 rounded-btn" disabled={uploading} asChild>
                <label>
                  {uploading ? <Loader2 className="animate-spin" /> : <Upload strokeWidth={1.75} />}
                  {v.audioKey ? "Đổi file" : "Tải file lên"}
                  <input type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/webm" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </Button>
              {v.audioKey ? (
                <Button type="button" variant="ghost" className="h-11" onClick={() => setV({ ...v, audioKey: undefined })}>Bỏ file</Button>
              ) : (
                <Button type="button" variant="ghost" className="h-11" disabled={!v.term} onClick={() => speak(v.term, v.languageCode)}>
                  <Play strokeWidth={1.75} /> Nghe thử giọng thiết bị
                </Button>
              )}
            </div>
            <span className="text-[13px] leading-[18px] text-muted-foreground">{v.audioKey ? "Dùng file đã tải lên" : "Mặc định: giọng đọc của thiết bị"}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Tag</span>
            <div className="flex flex-wrap gap-2">
              {v.tags.map((t) => (
                <button key={t} type="button" aria-label={`Bỏ tag ${t}`} onClick={() => setV({ ...v, tags: v.tags.filter((x) => x !== t) })} className="inline-flex h-8 items-center gap-1 rounded-full bg-muted px-3 text-[13px] font-medium">
                  {t} <X className="size-3.5" />
                </button>
              ))}
              <input
                aria-label="Thêm tag"
                placeholder="+ Thêm tag"
                maxLength={40}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    const t = tag.trim();
                    if (t && !v.tags.includes(t)) setV({ ...v, tags: [...v.tags, t] });
                    setTag("");
                  }
                }}
                className="h-8 w-28 rounded-full border border-dashed border-border-strong bg-transparent px-3 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <Field label="Ghi chú">
            <textarea maxLength={2000} rows={3} className={cn(inputClass, "h-auto py-3")} placeholder="Giải thích ngữ pháp, từ dễ nhầm…" value={v.notes ?? ""} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>
        </div>
      )}

      <p role="alert" className="min-h-[18px] text-[13px] text-destructive">{error}</p>
      <div className="sticky bottom-[calc(108px+env(safe-area-inset-bottom))] -mx-6 flex gap-3 border-t border-border bg-background px-6 py-3">
        {!wordId && (
          <Button type="button" variant="outline" size="xl" className="flex-1 font-medium" disabled={busy} onClick={(e) => save(e, true)}>
            Lưu & thêm tiếp
          </Button>
        )}
        <Button type="submit" size="xl" className="flex-1" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          Lưu từ
        </Button>
      </div>
    </form>
  );
}
