import { Bone, LoadingLabel, RowsSkeleton } from "@/components/skeletons";

export default function DecksLoading() {
  return (
    <main>
      <LoadingLabel />
      <Bone className="h-8 w-28" />
      <RowsSkeleton rows={5} className="mt-6" />
    </main>
  );
}
