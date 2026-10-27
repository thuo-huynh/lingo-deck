import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sharePreview } from "@/features/share/service";
import { languageName } from "@/features/decks/languages";
import { Button } from "@/components/ui/button";
import { AddSharedDeck } from "./add-button";

export const metadata: Metadata = { title: "Bộ từ được chia sẻ · LingoDeck" };

export default async function SharePage(props: PageProps<"/share/[token]">) {
  const { token } = await props.params;
  const user = await getCurrentUser();
  const deck = await sharePreview(token, user?._id).catch(() => null);
  if (!deck) {
    return (
      <main className="mt-10">
        <h1 className="text-2xl font-semibold">Link không còn hoạt động</h1>
        <p className="mt-2 text-body">Người chia sẻ đã tắt link này, hoặc bộ từ đã bị xoá.</p>
      </main>
    );
  }
  return (
    <main className="mt-10 flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-medium text-muted-foreground">Bộ từ được chia sẻ</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <span className="size-3 rounded-full" style={{ background: deck.color }} aria-hidden />
          {deck.name}
        </h1>
        <p className="mt-1 text-body">
          {deck.wordCount} từ{deck.subdecks ? ` · ${deck.subdecks} bộ con` : ""} · {languageName(deck.languageCode) ?? deck.languageCode}
        </p>
        {deck.description && <p className="mt-2 text-body">{deck.description}</p>}
      </div>
      {deck.sample.length > 0 && (
        <ul className="overflow-hidden rounded-card border border-border bg-card" aria-label="Một vài từ trong bộ">
          {deck.sample.map((w, i) => (
            <li key={i} className="flex justify-between gap-4 border-t border-border px-4 py-3 first:border-t-0">
              <span className="font-medium" lang={deck.languageCode}>{w.term}</span>
              <span className="truncate text-body">{w.meaningVi}</span>
            </li>
          ))}
        </ul>
      )}
      {deck.own ? (
        <p className="text-body">Đây là bộ từ của bạn.</p>
      ) : deck.copyId ? (
        <div className="flex flex-col gap-2">
          <p className="text-body">Bạn đã có bộ này trong thư viện.</p>
          <Button asChild size="xl"><Link href={`/decks/${deck.copyId}`}>Mở bộ từ</Link></Button>
        </div>
      ) : user ? (
        <AddSharedDeck token={token} />
      ) : (
        <Button asChild size="xl"><Link href={`/login?next=${encodeURIComponent(`/share/${token}`)}`}>Đăng nhập để thêm</Link></Button>
      )}
      <p className="text-[13px] leading-[18px] text-muted-foreground">Bạn nhận một bản sao riêng: tiến độ học bắt đầu từ đầu, người chia sẻ sửa bộ gốc cũng không ảnh hưởng tới bản của bạn.</p>
    </main>
  );
}
