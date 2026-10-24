import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createDeck } from "@/features/decks/service";

export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const deck = await createDeck(user._id, await req.json());
  return { id: deck._id.toHexString() };
});
