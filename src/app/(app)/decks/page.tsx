import { DeckRow } from "@/components/deck-row";
import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { deckCounts } from "@/features/stats/service";
import type { DeckDoc } from "@/lib/types";

/** Depth-first order so subdecks sit under their parent. */
function flattenTree(decks: DeckDoc[]) {
  const children = new Map<string, DeckDoc[]>();
  for (const d of decks) {
    const k = d.parentId?.toHexString() ?? "root";
    children.set(k, [...(children.get(k) ?? []), d]);
  }
  const out: { deck: DeckDoc; depth: number }[] = [];
  const walk = (key: string, depth: number) => {
    for (const d of children.get(key) ?? []) {
      out.push({ deck: d, depth });
      walk(d._id.toHexString(), depth + 1);
    }
  };
  walk("root", 0);
  return out;
}

export default async function DecksPage() {
  const user = await requireUser();
  const decks = await listDecks(user._id);
  const counts = await deckCounts(user);
  const rows = flattenTree(decks);

  return (
    <main>
      <div className="flex min-h-11 items-center">
        <h1 className="text-2xl font-semibold">Bộ từ</h1>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-card border border-border bg-card p-6 text-center">
          <p className="font-medium">Chưa có bộ từ nào</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Bấm nút + ở góc dưới để tạo bộ từ đầu tiên.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-card">
          {rows.map(({ deck, depth }, i) => {
            const c = counts(deck._id);
            return (
              <DeckRow
                key={deck._id.toHexString()}
                first={i === 0}
                indent={Math.min(depth, 3)}
                href={`/decks/${deck._id.toHexString()}`}
                name={deck.name}
                meta={`${c.total} từ`}
                color={deck.color}
                newCount={c.new}
                dueCount={c.due}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
