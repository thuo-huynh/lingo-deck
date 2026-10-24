"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/client-api";

type Pending = null | "reset" | "delete";

export function WordActions({ id, deckId, suspended }: { id: string; deckId: string; suspended: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);

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
      <Button
        variant="outline"
        className="h-11 rounded-btn"
        onClick={() => run(() => api(`/vocabulary/${id}`, { body: { action: suspended ? "unsuspend" : "suspend" } }), suspended ? "Đã tiếp tục học từ này" : "Đã tạm dừng từ này")}
      >
        {suspended ? "Tiếp tục học" : "Tạm dừng"}
      </Button>
      <Button variant="outline" className="h-11 rounded-btn" onClick={() => setPending("reset")}>Học lại từ đầu</Button>
      <Button variant="destructive" className="h-11 rounded-btn" onClick={() => setPending("delete")}>Xoá từ</Button>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending === "reset" ? "Học lại từ đầu?" : "Xoá từ này?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending === "reset"
                ? "Từ sẽ trở về trạng thái mới và được xếp lịch lại. Lịch sử ôn cũ vẫn được giữ."
                : "Từ sẽ không còn xuất hiện khi học. Lịch sử ôn vẫn được giữ."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant={pending === "delete" ? "destructive" : "default"}
              onClick={() =>
                pending === "reset"
                  ? run(() => api(`/vocabulary/${id}`, { body: { action: "reset" } }), "Đã đặt lại tiến độ")
                  : run(() => api(`/vocabulary/${id}`, { method: "DELETE" }), "Đã xoá từ", true)
              }
            >
              {pending === "reset" ? "Học lại" : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
