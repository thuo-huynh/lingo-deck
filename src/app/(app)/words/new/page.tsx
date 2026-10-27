import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { deckLanguage, getOwnedDeck, listDecks } from "@/features/decks/service";
import { WordForm } from "../word-form";

export default async function NewWordPage(props: PageProps<"/words/new">) {
  const user = await requireUser();
  const { deck: deckParam } = await props.searchParams;
  const decks = await listDecks(user._id);
  if (!decks.length) redirect("/decks/new");
  const deck = typeof deckParam === "string" ? await getOwnedDeck(user._id, deckParam) : decks[0];
  return (
    <WordForm
      decks={decks.map((d) => ({ id: d._id.toHexString(), name: d.name, color: d.color, depth: d.path.length - 1 }))}
      initial={{
        deckId: deck._id.toHexString(),
        term: "",
        meaningVi: "",
        languageCode: await deckLanguage(deck),
        acceptedAnswers: [],
        examples: [],
        hints: [],
        tags: [],
      }}
    />
  );
}
