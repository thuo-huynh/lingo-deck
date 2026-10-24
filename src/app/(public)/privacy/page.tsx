import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chính sách quyền riêng tư · LingoDeck" };

const CONTACT = "huynhngocthuong0208@gmail.com";
const UPDATED = "24/10/2026";

export default function PrivacyPage() {
  return (
    <main>
      <h1 className="mt-10 text-[28px] leading-[36px] font-semibold">Chính sách quyền riêng tư</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Cập nhật lần cuối: {UPDATED}</p>

      <Section title="Chúng tôi thu thập gì">
        <ul className="list-disc pl-5">
          <li>
            <b>Thông tin tài khoản:</b> địa chỉ email. Khi bạn đăng nhập bằng Google, chúng tôi chỉ nhận email đã được Google xác minh; tên và ảnh hồ sơ không được lưu.
          </li>
          <li>
            <b>Dữ liệu học tập:</b> bộ từ, từ vựng, ví dụ, gợi ý, tag, file âm thanh hoặc ảnh bạn tải lên, kết quả từng lượt học và lịch ôn.
          </li>
          <li>
            <b>Cài đặt:</b> múi giờ, giờ bắt đầu ngày học, mục tiêu ngày và cài đặt học.
          </li>
        </ul>
        <p>Chúng tôi không dùng cookie quảng cáo hay công cụ theo dõi của bên thứ ba. Ứng dụng chỉ dùng một cookie phiên đã mã hoá để giữ bạn đăng nhập.</p>
      </Section>

      <Section title="Chúng tôi dùng dữ liệu để làm gì">
        <p>Chỉ để vận hành ứng dụng: đăng nhập, lưu bộ từ của bạn, tính lịch ôn và hiện thống kê học tập. Chúng tôi không bán, cho thuê hay chia sẻ dữ liệu của bạn để quảng cáo.</p>
      </Section>

      <Section title="Dữ liệu được lưu ở đâu">
        <ul className="list-disc pl-5">
          <li>Cơ sở dữ liệu: MongoDB Atlas (máy chủ tại Singapore).</li>
          <li>Ứng dụng chạy trên Vercel.</li>
          <li>File âm thanh và ảnh: Cloudflare R2, chỉ chủ sở hữu mở được qua đường dẫn có hạn dùng.</li>
          <li>Đăng nhập: Google (khi bạn chọn đăng nhập bằng Google).</li>
        </ul>
        <p>Các nhà cung cấp này chỉ xử lý dữ liệu để cung cấp dịch vụ cho chúng tôi.</p>
      </Section>

      <Section title="Quyền của bạn">
        <ul className="list-disc pl-5">
          <li>Xuất toàn bộ từ vựng của một bộ ra file CSV bất kỳ lúc nào (menu của bộ từ → Xuất CSV).</li>
          <li>
            Yêu cầu xoá tài khoản và toàn bộ dữ liệu bằng cách gửi email tới <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. Chúng tôi xử lý trong vòng 30 ngày.
          </li>
          <li>
            Thu hồi quyền truy cập của LingoDeck vào tài khoản Google tại{" "}
            <a className="text-primary underline" href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.
          </li>
        </ul>
      </Section>

      <Section title="Liên hệ">
        <p>
          Câu hỏi về quyền riêng tư: <a className="text-primary underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 flex flex-col gap-3 text-[15px] leading-6 text-body">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
