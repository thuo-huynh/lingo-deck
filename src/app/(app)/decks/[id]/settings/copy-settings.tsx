"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/client-api";
import type { DeckSettings } from "@/lib/types";

/** Assigns this deck's settings to other decks (spec 5.4: one preset for many decks). */
export function CopySettings({ settings, decks }: { settings: DeckSettings; decks: { id: string; label: string }[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  if (!decks.length) return null;

  async function copy() {
    setBusy(true);
    try {
      await Promise.all(picked.map((id) => api(`/decks/${id}/settings`, { method: "PUT", body: settings })));
      toast.success(`Đã áp dụng cho ${picked.length} bộ từ`);
      setPicked([]);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không áp dụng được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-card border border-border bg-card p-4" aria-labelledby="copy-title">
      <h2 id="copy-title" className="font-semibold">Áp dụng cài đặt này cho bộ khác</h2>
      <p className="text-[13px] leading-[18px] text-muted-foreground">Dùng cài đặt đã lưu của bộ này. Tiến độ của các bộ được chọn không bị ảnh hưởng.</p>
      <ul className="mt-3 flex flex-col">
        {decks.map((d) => (
          <li key={d.id}>
            <label className="flex min-h-11 items-center gap-3">
              <Checkbox
                checked={picked.includes(d.id)}
                onCheckedChange={(on) => setPicked(on ? [...picked, d.id] : picked.filter((x) => x !== d.id))}
              />
              {d.label}
            </label>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="xl" className="mt-3 w-full font-medium" disabled={busy || !picked.length} onClick={copy}>
        {busy && <Loader2 className="animate-spin" />}
        Áp dụng cho {picked.length || ""} bộ đã chọn
      </Button>
    </section>
  );
}
