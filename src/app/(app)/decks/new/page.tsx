import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { DeckForm } from "../deck-form";

export default async function NewDeckPage(props: PageProps<"/decks/new">) {
  const user = await requireUser();
  const { parent } = await props.searchParams;
  const decks = await listDecks(user._id);
  return (
    <DeckForm
      decks={decks.map((d) => ({ id: d._id.toHexString(), name: d.name, depth: d.path.length - 1 }))}
      initial={{ name: "", parentId: typeof parent === "string" ? parent : "" }}
    />
  );
}
