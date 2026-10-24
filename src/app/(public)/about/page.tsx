import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "LingoDeck · Học từ vựng theo lịch ôn thông minh",
  description: "Học từ vựng ngoại ngữ với lịch ôn FSRS: thẻ ghi nhớ, viết từ và nghe viết trong một ứng dụng web cài được lên điện thoại.",
};

const FEATURES = [
  { title: "Ôn đúng lúc sắp quên", body: "Lịch ôn FSRS tính thời điểm ôn tiếp theo cho từng từ, để bạn nhớ lâu mà không phải ôn thừa." },
  { title: "Ba bước cho mỗi từ", body: "Thẻ ghi nhớ để nhận ra nghĩa, viết từ từ nghĩa tiếng Việt, rồi nghe và viết lại. Bạn chọn 1, 2 hoặc 3 bước." },
  { title: "Bộ từ của riêng bạn", body: "Tạo bộ từ và bộ con, thêm ví dụ, gợi ý, âm thanh, hoặc nhập hàng loạt từ file CSV." },
  { title: "Dùng như ứng dụng", body: "Thêm vào Màn hình chính trên iPhone hoặc Android để mở toàn màn hình." },
];

export default function AboutPage() {
  return (
    <main>
      <h1 className="mt-10 text-[32px] leading-[40px] font-semibold">Học từ vựng mỗi ngày, nhớ lâu hơn</h1>
      <p className="mt-3 text-base text-body">
        LingoDeck là ứng dụng học từ vựng ngoại ngữ cho người Việt, kết hợp lịch ôn ngắt quãng (spaced repetition) với cách luyện tập thân thiện.
      </p>
      <Button asChild size="xl" className="mt-6">
        <Link href="/login">Bắt đầu học</Link>
      </Button>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <li key={f.title} className="rounded-card border border-border bg-card p-5">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-[15px] text-body">{f.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
