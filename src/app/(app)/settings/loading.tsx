import { Bone, LoadingLabel } from "@/components/skeletons";

export default function SettingsLoading() {
  return (
    <main>
      <LoadingLabel />
      <Bone className="h-8 w-28" />
      <Bone className="mt-2 h-3 w-64" />
      <Bone className="mt-6 h-80 w-full rounded-card" />
      <Bone className="mt-4 h-14 w-full rounded-card" />
    </main>
  );
}
