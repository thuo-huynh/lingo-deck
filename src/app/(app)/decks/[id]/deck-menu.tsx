"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, Link2, Share2, FileSpreadsheet, FolderPlus, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { inputClass } from "@/components/field";
import { BottomSheet, ConfirmSheet, SheetAction } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client-api";

export function DeckMenu({
  deckId,
  name,
  shareToken,
  moveTargets,
}: {
  deckId: string;
  name: string;
  shareToken: string | null;
  moveTargets: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [token, setToken] = useState(shareToken);
  const link = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  async function toggleShare(enabled: boolean) {
    try {
      const r = await api<{ token: string | null }>(`/decks/${deckId}/share`, { method: "PUT", body: { enabled } });
      setToken(r.token);
      toast.success(enabled ? "Đã bật link chia sẻ" : "Đã tắt link, link cũ không còn dùng được");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được chia sẻ");
    }
  }

  async function shareLink() {
    // iOS share sheet when available; otherwise copy.
    if (navigator.share) return navigator.share({ title: name, url: link }).catch(() => {});
    await navigator.clipboard.writeText(link);
    toast.success("Đã sao chép link");
  }
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
          <SheetAction
            icon={<Share2 strokeWidth={1.75} />}
            onClick={() => {
              setMenu(false);
              setSharing(true);
            }}
          >
            Chia sẻ
          </SheetAction>
          <SheetAction href={`/decks/${deckId}/import`} icon={<FileSpreadsheet strokeWidth={1.75} />}>Nhập nhiều từ</SheetAction>
          <SheetAction href={`/api/v1/decks/${deckId}/export`} download icon={<Download strokeWidth={1.75} />}>Xuất CSV</SheetAction>
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
      <BottomSheet
        open={sharing}
        onOpenChange={setSharing}
        title={`Chia sẻ “${name}”`}
        description="Ai có link và đã đăng nhập đều thêm được một bản sao vào thư viện của họ. Tiến độ học của bạn không được chia sẻ."
      >
        <div className="flex flex-col gap-3 px-2 pb-2">
          <label className="flex min-h-14 items-center justify-between gap-3">
            <span className="font-medium">Chia sẻ bằng link</span>
            <Switch checked={!!token} onCheckedChange={toggleShare} />
          </label>
          {token && (
            <>
              <input readOnly value={link} aria-label="Link chia sẻ" className={inputClass} onFocus={(e) => e.currentTarget.select()} />
              <Button size="xl" onClick={shareLink}>
                <Link2 /> Gửi link
              </Button>
            </>
          )}
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
