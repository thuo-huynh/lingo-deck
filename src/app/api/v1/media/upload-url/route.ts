import { randomUUID } from "node:crypto";
import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { MAX_MEDIA_BYTES, MEDIA_TYPES, presignUpload } from "@/lib/r2";

const input = z.object({
  contentType: z.enum(Object.keys(MEDIA_TYPES) as [keyof typeof MEDIA_TYPES]),
  size: z.number().int().min(1).max(MAX_MEDIA_BYTES, "Tệp tối đa 5 MB"),
});

export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { contentType, size } = input.parse(await req.json());
  // Key is namespaced by owner so the download route can check ownership from the key alone.
  const key = `${user._id.toHexString()}/${randomUUID()}.${MEDIA_TYPES[contentType]}`;
  return { key, uploadUrl: await presignUpload(key, contentType, size) };
});
