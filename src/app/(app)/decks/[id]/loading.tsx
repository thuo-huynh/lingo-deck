import { Bone, LoadingLabel, RowsSkeleton } from "@/components/skeletons";

export default function DeckLoading() {
  return (
    <main>
      <LoadingLabel />
      <Bone className="size-11 rounded-full" />
      <Bone className="mt-3 h-3 w-24" />
      <Bone className="mt-2 h-7 w-48" />
      <Bone className="mt-2 h-4 w-56" />
      <Bone className="mt-5 h-[52px] w-full rounded-btn" />
      <Bone className="mt-8 h-5 w-24" />
      <Bone className="mt-3 h-12 w-full" />
      <RowsSkeleton rows={6} className="mt-3" />
    </main>
  );
}
