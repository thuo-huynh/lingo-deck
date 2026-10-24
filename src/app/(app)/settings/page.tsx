import { requireUser } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/features/decks/settings";
import { SettingsForm } from "@/components/settings-form";
import { AccountSection } from "./account";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <main>
      <h1 className="text-2xl font-semibold">Cài đặt</h1>
      <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">Preset “Mặc định” · dùng cho mọi bộ từ chưa có cài đặt riêng</p>
      <div className="mt-6">
        <SettingsForm initial={user.defaultSettings ?? DEFAULT_SETTINGS} endpoint="/me/settings" />
      </div>
      <AccountSection timezone={user.timezone} email={user.email} dailyGoal={user.dailyGoal} dayStartHour={user.dayStartHour} displayName={user.displayName ?? ""} />
    </main>
  );
}
