"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AsyncButton } from "@/components/async-button";
import { api } from "@/lib/client-api";

export function AddSharedDeck({ token }: { token: string }) {
  const router = useRouter();
  return (
    <AsyncButton
      size="xl"
      onClick={async () => {
        try {
          const r = await api<{ id: string; created: boolean }>(`/share/${token}`, { body: {} });
          toast.success(r.created ? "Đã thêm vào thư viện" : "Bạn đã có bộ này");
          router.push(`/decks/${r.id}`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Không thêm được");
        }
      }}
    >
      Thêm vào thư viện
    </AsyncButton>
  );
}
