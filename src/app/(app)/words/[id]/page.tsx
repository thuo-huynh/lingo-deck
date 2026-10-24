import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { getOwnedVocab } from "@/features/vocab/service";
import { WordForm } from "../word-form";
import { WordActions } from "./word-actions";

const STATE_LABEL = { NEW: "Chưa học", LEARNING: "Đang học", REVIEW: "Đang ôn", RELEARNING: "Học lại" } as const;

export default async function EditWordPage(props: PageProps<"/words/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const [w, decks] = await Promise.all([getOwnedVocab(user._id, id), listDecks(user._id)]);
  const due = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: user.timezone }).format(w.srs.due);

  return (
    <>
      <WordForm
        wordId={id}
        decks={decks.map((d) => ({ id: d._id.toHexString(), name: d.name, color: d.color, depth: d.path.length - 1 }))}
        initial={{
          deckId: w.deckId.toHexString(),
          term: w.term,
          meaningVi: w.meaningVi,
          languageCode: w.languageCode,
          partOfSpeech: w.partOfSpeech,
          phonetic: w.phonetic,
          acceptedAnswers: w.acceptedAnswers,
          examples: w.examples,
          hints: w.hints,
          tags: w.tags,
          notes: w.notes,
          audioKey: w.audioKey,
        }}
      />
      <section className="mt-8 rounded-card border border-border bg-card p-5" aria-label="Tiến độ">
        <p className="text-[13px] leading-[18px] font-medium text-muted-foreground">Tiến độ</p>
        <p className="mt-1 font-medium">
          {w.status === "suspended" ? "Đang tạm dừng" : STATE_LABEL[w.srs.state]}
          {w.srs.state !== "NEW" && <span className="text-body"> · ôn tiếp {due}</span>}
        </p>
        <p className="text-[13px] text-muted-foreground tabular-nums">
          {w.srs.card.reps} lượt ôn · quên {w.srs.card.lapses} lần
        </p>
        <WordActions id={id} deckId={w.deckId.toHexString()} suspended={w.status === "suspended"} />
      </section>
    </>
  );
}
