import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createVocab } from "@/features/vocab/service";

export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const v = await createVocab(user._id, await req.json());
  return { id: v._id.toHexString() };
});
