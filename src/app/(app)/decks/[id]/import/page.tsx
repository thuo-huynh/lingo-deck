import { requireUser } from "@/lib/auth";
import { getOwnedDeck } from "@/features/decks/service";
import { CsvImport } from "./csv-import";

export default async function ImportPage(props: PageProps<"/decks/[id]/import">) {
  const user = await requireUser();
  const { id } = await props.params;
  const deck = await getOwnedDeck(user._id, id);
  return <CsvImport deckId={id} deckName={deck.name} deckColor={deck.color} />;
}
