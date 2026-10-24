import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập · LingoDeck" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(72px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <p className="text-2xl font-semibold tracking-tight">
        Lingo<span className="text-primary">Deck</span>
      </p>
      <h1 className="mt-8 text-2xl font-semibold">Học từ vựng mỗi ngày</h1>
      <p className="mt-2 text-base text-body">Ôn đúng lúc sắp quên, nhớ lâu hơn.</p>
      <LoginForm />
    </main>
  );
}
