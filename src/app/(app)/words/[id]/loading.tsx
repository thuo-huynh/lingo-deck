import { Bone, LoadingLabel } from "@/components/skeletons";

export default function WordLoading() {
  return (
    <main className="flex flex-col gap-5">
      <LoadingLabel />
      <Bone className="h-8 w-32" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bone className="h-3 w-20" />
          <Bone className="h-[52px] w-full" />
        </div>
      ))}
      <Bone className="h-16 w-full rounded-btn" />
    </main>
  );
}
