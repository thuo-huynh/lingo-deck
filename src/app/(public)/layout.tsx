import Link from "next/link";

/** Pages readable without signing in (Google's OAuth review needs a public home page and privacy policy). */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 pt-[max(48px,env(safe-area-inset-top))] pb-[max(48px,env(safe-area-inset-bottom))]">
      <Link href="/about" className="text-2xl font-semibold tracking-tight">
        Lingo<span className="text-primary">Deck</span>
      </Link>
      {children}
      <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-[13px] text-muted-foreground">
        <Link href="/about">Giới thiệu</Link>
        <Link href="/privacy">Chính sách quyền riêng tư</Link>
        <Link href="/login">Đăng nhập</Link>
      </footer>
    </div>
  );
}
