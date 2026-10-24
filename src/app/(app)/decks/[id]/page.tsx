import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getOwnedDeck, listDecks } from "@/features/decks/service";
import { listDeckVocab } from "@/features/vocab/service";
import { deckCounts } from "@/features/stats/service";
import { DeckMenu } from "./deck-menu";

const STATE_LABEL = { NEW: "Mới", LEARNING: "Đang học", REVIEW: "Ôn", RELEARNING: "Học lại" } as const;

export default async function DeckPage(props: PageProps<"/decks/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.slice(0, 100) : "";
  const deck = await getOwnedDeck(user._id, id);
  const [decks, counts, words] = await Promise.all([
    listDecks(user._id),
    deckCounts(user),
    listDeckVocab(user._id, id, { q: query || undefined, includeSubdecks: true, limit: 200 }),
  ]);
  const byId = new Map(decks.map((d) => [d._id.toHexString(), d]));
  const crumbs = deck.path.slice(0, -1).map((p) => byId.get(p.toHexString())?.name).filter(Boolean).join(" › ");
  const subdecks = decks.filter((d) => d.parentId?.equals(deck._id));
  const c = counts(deck._id);

  return (
    <main>
      <div className="-mx-2 flex items-center justify-between">
        <Button asChild variant="ghost" size="icon-lg" className="size-11">
          <Link href={deck.parentId ? `/decks/${deck.parentId.toHexString()}` : "/decks"} aria-label="Quay lại">
            <ChevronLeft className="size-6" strokeWidth={1.75} />
          </Link>
        </Button>
        <DeckMenu
          deckId={id}
          name={deck.name}
          moveTargets={decks
            .filter((d) => !d.path.some((p) => p.equals(deck._id)))
            .map((d) => ({ id: d._id.toHexString(), label: d.path.map((p) => byId.get(p.toHexString())?.name).join(" › ") }))}
        />
      </div>

      <div className="mt-2">
        {crumbs && (
          <div className="flex items-center gap-2 text-[13px] leading-[18px] font-medium text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ background: deck.color }} aria-hidden />
            {crumbs}
          </div>
        )}
        <h1 className="mt-1 text-2xl font-semibold">{deck.name}</h1>
        <p className="mt-1 text-body tabular-nums">
          <span className="font-semibold text-foreground">{c.total}</span> từ · <span className="font-semibold text-foreground">{c.due}</span> đến hạn ·{" "}
          <span className="font-semibold text-primary">{c.new}</span> mới
        </p>
        <Button asChild size="xl" className="mt-5 w-full">
          <Link href={`/study/setup?deck=${id}`}>Học</Link>
        </Button>
      </div>

      {subdecks.length > 0 && (
        <>
          <h2 className="mt-8 text-base font-semibold">Bộ con</h2>
          <div className="mt-2 overflow-hidden rounded-card border border-border bg-card">
            {subdecks.map((s, i) => (
              <Link key={s._id.toHexString()} href={`/decks/${s._id.toHexString()}`} className={`flex min-h-[56px] items-center gap-3 px-4 active:bg-muted ${i ? "border-t border-border" : ""}`}>
                <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="flex-1 truncate font-medium">{s.name}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{counts(s._id).total} từ</span>
                <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold">Từ vựng</h2>
        <Link href={`/words/new?deck=${id}`} className="flex items-center gap-1 py-3 text-[13px] leading-[18px] font-semibold text-primary">
          <Plus className="size-4" strokeWidth={2} /> Thêm từ
        </Link>
      </div>
      <form className="relative mt-1" role="search">
        <label htmlFor="q" className="sr-only">Tìm từ trong bộ</label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Tìm từ hoặc nghĩa"
          className="h-12 w-full rounded-field border border-border bg-card pr-4 pl-12 outline-none focus-visible:border-primary"
        />
      </form>

      {words.length === 0 ? (
        <p className="mt-6 text-center text-[13px] text-muted-foreground">{query ? "Không tìm thấy từ nào." : "Chưa có từ nào. Thêm từ đầu tiên để bắt đầu học."}</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-card border border-border bg-card">
          {words.map((w, i) => (
            <Link key={w._id.toHexString()} href={`/words/${w._id.toHexString()}`} className={`flex min-h-[64px] items-center gap-3 px-4 py-3 active:bg-muted ${i ? "border-t border-border" : ""}`}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{w.term}</span>
                <span className="truncate text-[13px] leading-[18px] text-muted-foreground">{w.meaningVi}</span>
              </span>
              <span className="flex flex-col items-end text-[13px] text-muted-foreground">
                {w.status === "suspended" ? "Tạm dừng" : STATE_LABEL[w.srs.state]}
                {w.leech && <span className="rounded-full bg-hard-soft px-2 font-medium text-hard">Khó nhớ</span>}
              </span>
              <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
