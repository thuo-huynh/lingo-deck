# LingoDeck

Học từ vựng theo lịch ôn FSRS, mỗi từ luyện 1–3 bước (Thẻ ghi nhớ → Viết từ → Nghe & viết). Next.js 16 (App Router) · MongoDB Atlas · Cloudflare R2 · shadcn/ui + Tailwind 4 · PWA cho iOS.

## Chạy local

```bash
npm install
npm run dev:db      # MongoDB replica set cục bộ ở cổng 27027 (dữ liệu trong .devdb/)
npm run dev         # http://localhost:3000
```

`.env.local` cho dev (xem `.env.example`):

```
MONGODB_URI=mongodb://127.0.0.1:27027/?replicaSet=testset&directConnection=true
MONGODB_DB=lingodeck
SESSION_PASSWORD=<32+ ký tự ngẫu nhiên>
```

Khi chưa có `RESEND_API_KEY`, mã đăng nhập 6 số được in ra log của `npm run dev`.

## Kiểm thử

```bash
npm test            # Vitest: logic chấm điểm, FSRS, phiên học (MongoDB in-memory thật), OTP
npm run typecheck
npm run lint
```

## Production

| Biến | Ghi chú |
|---|---|
| `MONGODB_URI` | Atlas connection string (Atlas luôn là replica set → hỗ trợ transaction) |
| `SESSION_PASSWORD` | 32+ ký tự, dùng để mã hoá cookie phiên và băm mã OTP |
| `RESEND_API_KEY`, `EMAIL_FROM` | Gửi mã đăng nhập; domain gửi phải được xác minh trên Resend |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Upload âm thanh/ảnh |

R2 bucket cần CORS cho phép `PUT` từ domain của app (trình duyệt upload thẳng lên R2 bằng presigned URL):

```json
[{ "AllowedOrigins": ["https://your-domain"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
```

## Cài lên iPhone

Mở app bằng Safari → nút Chia sẻ → **Thêm vào Màn hình chính**. App chạy toàn màn hình (standalone), có trang ngoại tuyến khi mất mạng. Việc học vẫn cần mạng: offline đầy đủ là P2 trong spec.

## Kiến trúc

```
src/features/
  study/attempt.ts      Chính sách rating: các bước chỉ là cổng của 1 attempt → đúng 1 rating FSRS (spec 4.4)
  study/answer.ts       Chuẩn hoá & chấm đáp án theo locale (spec 9.1)
  study/session.ts      Hàng đợi, ghi từng bước, finalize trong transaction + idempotent (spec 11.2)
  study/view.ts         Dữ liệu gửi cho client theo bước, không lộ đáp án trước khi trả lời
  scheduling/fsrs.ts    Adapter ts-fsrs (server là nguồn chân lý cho due_at)
  decks/, vocab/, stats/, auth/
```

- Trạng thái SRS nhúng trong document từ vựng (mỗi từ thuộc 1 người học), có `revision` để chặn ghi đè giữa 2 tab.
- `reviewLogs.attemptKey` là unique → gửi lại cùng một attempt không bao giờ tạo review thứ hai (AC-10).
- Cài đặt học: bộ từ → bộ cha → preset “Mặc định” của người dùng → mặc định của sản phẩm.
