import { Bone, LoadingLabel, RowsSkeleton } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <main className="flex flex-col">
      <LoadingLabel />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-7 w-40" />
        </div>
        <Bone className="h-9 w-20 rounded-full" />
      </div>
      <div className="mt-6 flex flex-col gap-5 rounded-card border border-border bg-card p-6">
        <Bone className="h-3 w-16" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bone className="h-7 w-10" />
              <Bone className="h-3 w-14" />
            </div>
          ))}
        </div>
        <Bone className="h-2 w-full rounded-full" />
        <Bone className="h-[52px] w-full rounded-btn" />
      </div>
      <Bone className="mt-8 h-5 w-32" />
      <RowsSkeleton rows={3} className="mt-3" />
    </main>
  );
}
