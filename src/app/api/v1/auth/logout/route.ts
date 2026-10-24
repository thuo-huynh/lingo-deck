import { handler } from "@/lib/api";
import { getCookieSession } from "@/lib/session-cookie";

export const POST = handler(async () => {
  (await getCookieSession()).destroy();
});
