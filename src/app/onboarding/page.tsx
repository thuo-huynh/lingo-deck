import { requireUser } from "@/lib/auth";
import { Onboarding } from "./onboarding";

export default async function OnboardingPage() {
  await requireUser();
  return <Onboarding />;
}
