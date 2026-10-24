"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, FolderPlus, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { inputClass } from "@/components/field";
import { BottomSheet, ConfirmSheet, SheetAction } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";

export function DeckMenu({ deckId, name, moveTargets }: { deckId: string; name: string; moveTargets: { id: string; label: string }[] }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [moveTo, setMoveTo] = useState("");

  async function remove() {
    try {
      await api(`/decks/${deckId}${moveTo ? `?moveTo=${moveTo}` : ""}`, { method: "DELETE" });
      toast.success(`Đã xoá “${name}”`);
      router.replace("/decks");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xoá được");
    }
  }

  async function reorder(direction: "up" | "down") {
    setMenu(false);
    try {
      await api(`/decks/${deckId}`, { body: { direction } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được thứ tự");
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon-lg" className="size-11" aria-label="Tùy chọn bộ từ" onClick={() => setMenu(true)}>
        <MoreHorizontal className="size-6" strokeWidth={1.75} />
      </Button>
      <BottomSheet open={menu} onOpenChange={setMenu} title={name}>
        <div className="flex flex-col pb-2">
          <SheetAction href={`/decks/${deckId}/edit`} icon={<Pencil strokeWidth={1.75} />}>Đổi tên / chuyển</SheetAction>
          <SheetAction href={`/decks/new?parent=${deckId}`} icon={<FolderPlus strokeWidth={1.75} />}>Thêm bộ con</SheetAction>
          <SheetAction href={`/decks/${deckId}/settings`} icon={<SlidersHorizontal strokeWidth={1.75} />}>Cài đặt học</SheetAction>
          <SheetAction href={`/decks/${deckId}/import`} icon={<FileSpreadsheet strokeWidth={1.75} />}>Nhập CSV</SheetAction>
          <a href={`/api/v1/decks/${deckId}/export`} download className="flex min-h-14 items-center gap-3 rounded-btn px-3 text-base font-medium active:bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground">
            <Download strokeWidth={1.75} /> Xuất CSV
          </a>
          <SheetAction onClick={() => reorder("up")} icon={<ArrowUp strokeWidth={1.75} />}>Lên trên</SheetAction>
          <SheetAction onClick={() => reorder("down")} icon={<ArrowDown strokeWidth={1.75} />}>Xuống dưới</SheetAction>
          <div className="my-1 h-px bg-border" />
          <SheetAction
            destructive
            icon={<Trash2 strokeWidth={1.75} />}
            onClick={() => {
              setMenu(false);
              setConfirm(true);
            }}
          >
            Xoá bộ từ
          </SheetAction>
        </div>
      </BottomSheet>
      <ConfirmSheet
        open={confirm}
        onOpenChange={setConfirm}
        title={`Xoá “${name}”?`}
        description="Bộ từ và các bộ con sẽ được lưu trữ, không còn hiện trong thư viện. Lịch sử học của các từ vẫn được giữ lại."
        confirmLabel="Xoá"
        destructive
        onConfirm={remove}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] leading-[18px] font-medium text-body">Các từ trong bộ</span>
          <select className={inputClass} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">Lưu trữ cùng bộ từ</option>
            {moveTargets.map((d) => (
              <option key={d.id} value={d.id}>Chuyển sang {d.label}</option>
            ))}
          </select>
          {moveTo && <span className="text-[13px] leading-[18px] text-muted-foreground">Từ của mọi bộ con cũng được gộp vào bộ này, tiến độ học giữ nguyên.</span>}
        </label>
      </ConfirmSheet>
    </>
  );
}
