import { requireUser } from "@/lib/auth";
import { deckLanguage, listDecks } from "@/features/decks/service";
import { DeckForm } from "../deck-form";

export default async function NewDeckPage(props: PageProps<"/decks/new">) {
  const user = await requireUser();
  const { parent } = await props.searchParams;
  const decks = await listDecks(user._id);
  // A new deck starts in its parent's language, else the language of the user's first deck.
  const near = decks.find((d) => d._id.toHexString() === parent) ?? decks[0];
  const languageCode = near ? await deckLanguage(near) : "en-US";
  return (
    <DeckForm
      decks={decks.map((d) => ({ id: d._id.toHexString(), name: d.name, depth: d.path.length - 1 }))}
      initial={{ name: "", parentId: typeof parent === "string" ? parent : "", languageCode }}
    />
  );
}
