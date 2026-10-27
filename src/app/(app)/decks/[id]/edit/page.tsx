import { requireUser } from "@/lib/auth";
import { deckLanguage, getOwnedDeck, listDecks } from "@/features/decks/service";
import { DeckForm } from "../../deck-form";

export default async function EditDeckPage(props: PageProps<"/decks/[id]/edit">) {
  const user = await requireUser();
  const { id } = await props.params;
  const deck = await getOwnedDeck(user._id, id);
  // A deck cannot move under itself or its own subdecks.
  const decks = (await listDecks(user._id)).filter((d) => !d.path.some((p) => p.equals(deck._id)));
  return (
    <DeckForm
      deckId={id}
      decks={decks.map((d) => ({ id: d._id.toHexString(), name: d.name, depth: d.path.length - 1 }))}
      initial={{ name: deck.name, description: deck.description, parentId: deck.parentId?.toHexString() ?? "", color: deck.color, languageCode: await deckLanguage(deck) }}
    />
  );
}
