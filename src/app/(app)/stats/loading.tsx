import { Bone, LoadingLabel } from "@/components/skeletons";

export default function StatsLoading() {
  return (
    <main>
      <LoadingLabel />
      <Bone className="h-8 w-32" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[84px] rounded-card" />
        ))}
      </div>
      <Bone className="mt-6 h-56 w-full rounded-card" />
      <Bone className="mt-4 h-48 w-full rounded-card" />
    </main>
  );
}
