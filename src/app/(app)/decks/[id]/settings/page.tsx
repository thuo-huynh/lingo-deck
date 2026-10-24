import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDeckSettings, getOwnedDeck, listDecks } from "@/features/decks/service";
import { SettingsForm } from "@/components/settings-form";
import { InheritButton } from "./inherit-button";
import { CopySettings } from "./copy-settings";

export default async function DeckSettingsPage(props: PageProps<"/decks/[id]/settings">) {
  const user = await requireUser();
  const { id } = await props.params;
  const deck = await getOwnedDeck(user._id, id);
  const settings = await getDeckSettings(user._id, deck);
  const decks = await listDecks(user._id);
  const byId = new Map(decks.map((d) => [d._id.toHexString(), d]));
  return (
    <main>
      <Button asChild variant="ghost" size="icon-lg" className="-ml-2 size-11">
        <Link href={`/decks/${id}`} transitionTypes={["nav-back"]} aria-label="Quay lại"><ChevronLeft className="size-6" strokeWidth={1.75} /></Link>
      </Button>
      <h1 className="mt-2 text-2xl font-semibold">Cài đặt học · {deck.name}</h1>
      <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
        {deck.settings ? "Bộ từ này dùng cài đặt riêng (áp dụng cho cả bộ con chưa có cài đặt riêng)." : "Đang dùng cài đặt kế thừa. Lưu để tạo cài đặt riêng cho bộ này."}
      </p>
      <div className="mt-6">
        <SettingsForm initial={settings} endpoint={`/decks/${id}/settings`} footer={deck.settings ? <InheritButton deckId={id} /> : null} />
      </div>
      {deck.settings && (
        <CopySettings
          settings={deck.settings}
          decks={decks
            .filter((d) => !d._id.equals(deck._id))
            .map((d) => ({ id: d._id.toHexString(), label: d.path.map((p) => byId.get(p.toHexString())?.name).join(" › ") }))}
        />
      )}
    </main>
  );
}
