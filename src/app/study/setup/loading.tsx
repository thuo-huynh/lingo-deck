import { Bone, LoadingLabel } from "@/components/skeletons";

export default function SetupLoading() {
  return (
    <div className="flex flex-1 flex-col justify-end bg-black/10">
      <LoadingLabel />
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-t-[20px] bg-card px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Bone className="mx-auto h-1 w-24 rounded-full" />
        <Bone className="h-7 w-56" />
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[52px] w-full" />
        ))}
        <Bone className="h-[52px] w-full rounded-btn" />
      </div>
    </div>
  );
}
