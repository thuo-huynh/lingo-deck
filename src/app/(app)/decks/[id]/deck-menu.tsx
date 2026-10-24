"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, FolderPlus, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { inputClass } from "@/components/field";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/client-api";

export function DeckMenu({ deckId, name, moveTargets }: { deckId: string; name: string; moveTargets: { id: string; label: string }[] }) {
  const router = useRouter();
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
    try {
      await api(`/decks/${deckId}`, { body: { direction } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được thứ tự");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" className="size-11" aria-label="Tùy chọn bộ từ">
            <MoreHorizontal className="size-6" strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild className="min-h-11">
            <Link href={`/decks/${deckId}/edit`}><Pencil /> Đổi tên / chuyển</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11">
            <Link href={`/decks/new?parent=${deckId}`}><FolderPlus /> Thêm bộ con</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11">
            <Link href={`/decks/${deckId}/settings`}><SlidersHorizontal /> Cài đặt học</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11">
            <Link href={`/decks/${deckId}/import`}><FileSpreadsheet /> Nhập CSV</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11">
            <a href={`/api/v1/decks/${deckId}/export`} download><Download /> Xuất CSV</a>
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => reorder("up")}>
            <ArrowUp /> Lên trên
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => reorder("down")}>
            <ArrowDown /> Xuống dưới
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="min-h-11" onSelect={() => setConfirm(true)}>
            <Trash2 /> Xoá bộ từ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Bộ từ và các bộ con sẽ được lưu trữ, không còn hiện trong thư viện. Lịch sử học của các từ vẫn được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Các từ trong bộ</span>
            <select className={inputClass} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="">Lưu trữ cùng bộ từ</option>
              {moveTargets.map((d) => (
                <option key={d.id} value={d.id}>Chuyển sang {d.label}</option>
              ))}
            </select>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
