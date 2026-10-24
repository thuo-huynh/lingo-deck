"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AsyncButton } from "@/components/async-button";
import { api } from "@/lib/client-api";

export function InheritButton({ deckId }: { deckId: string }) {
  const router = useRouter();
  return (
    <AsyncButton
      variant="outline"
      size="xl"
      className="font-medium"
      onClick={async () => {
        try {
          await api(`/decks/${deckId}/settings`, { method: "PUT", body: null });
          toast.success("Đã chuyển về cài đặt kế thừa");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
        }
      }}
    >
      Dùng cài đặt kế thừa
    </AsyncButton>
  );
}
