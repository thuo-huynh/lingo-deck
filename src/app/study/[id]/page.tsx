import { requireUser } from "@/lib/auth";
import { getOwnedSession } from "@/features/study/session";
import { sessionView } from "@/features/study/view";
import { StudyPlayer } from "./player";

export default async function StudyPage(props: PageProps<"/study/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const view = await sessionView(await getOwnedSession(user._id, id), user._id);
  return <StudyPlayer initial={view} />;
}
