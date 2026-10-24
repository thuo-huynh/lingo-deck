"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/async-button";
import { ConfirmSheet } from "@/components/bottom-sheet";
import { api } from "@/lib/client-api";


const CONFIRM = {
  reset: {
    title: "Học lại từ đầu?",
    description: "Từ sẽ trở về trạng thái mới và được xếp lịch lại. Lịch sử ôn cũ vẫn được giữ.",
    confirmLabel: "Học lại",
    destructive: false,
  },
  delete: {
    title: "Xoá từ này?",
    description: "Từ sẽ không còn xuất hiện khi học. Lịch sử ôn vẫn được giữ.",
    confirmLabel: "Xoá",
    destructive: true,
  },
};

export function WordActions({ id, deckId, suspended }: { id: string; deckId: string; suspended: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Kept after closing so the sheet's text doesn't change while it slides away.
  const [kind, setKind] = useState<"reset" | "delete">("reset");
  const ask = (k: "reset" | "delete") => {
    setKind(k);
    setOpen(true);
  };

  async function run(fn: () => Promise<unknown>, done: string, back = false) {
    try {
      await fn();
      toast.success(done);
      if (back) router.replace(`/decks/${deckId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <AsyncButton
        variant="outline"
        className="h-11 rounded-btn"
        onClick={() => run(() => api(`/vocabulary/${id}`, { body: { action: suspended ? "unsuspend" : "suspend" } }), suspended ? "Đã tiếp tục học từ này" : "Đã tạm dừng từ này")}
      >
        {suspended ? "Tiếp tục học" : "Tạm dừng"}
      </AsyncButton>
      <Button variant="outline" className="h-11 rounded-btn" onClick={() => ask("reset")}>Học lại từ đầu</Button>
      <Button variant="destructive" className="h-11 rounded-btn" onClick={() => ask("delete")}>Xoá từ</Button>

      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        {...CONFIRM[kind]}
        onConfirm={() =>
          kind === "reset"
            ? run(() => api(`/vocabulary/${id}`, { body: { action: "reset" } }), "Đã đặt lại tiến độ")
            : run(() => api(`/vocabulary/${id}`, { method: "DELETE" }), "Đã xoá từ", true)
        }
      />
    </div>
  );
}
