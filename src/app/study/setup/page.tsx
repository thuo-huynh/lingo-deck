import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDeckSettings, listDecks } from "@/features/decks/service";
import { collections } from "@/lib/db";
import { StudySetup } from "./study-setup";

export default async function StudySetupPage(props: PageProps<"/study/setup">) {
  const user = await requireUser();
  const { deck: deckParam, mode } = await props.searchParams;
  const decks = await listDecks(user._id);
  if (!decks.length) redirect("/decks/new");
  const byId = new Map(decks.map((d) => [d._id.toHexString(), d]));
  const options = await Promise.all(
    decks.map(async (d) => ({
      id: d._id.toHexString(),
      label: d.path.map((p) => byId.get(p.toHexString())?.name).join(" › "),
      color: d.color,
      hasChildren: decks.some((x) => x.parentId?.equals(d._id)),
      steps: (await getDeckSettings(user._id, d)).steps,
    }))
  );
  const { vocab } = await collections();
  const tags = ((await vocab.distinct("tags", { ownerId: user._id, status: "active" })) as string[]).sort();
  const initial = typeof deckParam === "string" && byId.has(deckParam) ? deckParam : options[0].id;
  return <StudySetup decks={options} initialDeckId={initial} initialMode={mode === "practice" ? "practice" : "scheduled"} tags={tags} />;
}
