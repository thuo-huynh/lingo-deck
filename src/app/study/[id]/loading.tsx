import { Bone, LoadingLabel } from "@/components/skeletons";

export default function StudyLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(16px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <LoadingLabel />
      <div className="flex items-center justify-between py-2">
        <Bone className="size-11 rounded-full" />
        <Bone className="h-4 w-16" />
        <span className="size-11" />
      </div>
      <Bone className="h-2 w-full rounded-full" />
      <Bone className="mt-5 h-4 w-40" />
      <Bone className="mt-6 min-h-[320px] flex-1 rounded-card" />
      <Bone className="mt-4 h-[52px] w-full rounded-btn" />
    </div>
  );
}
