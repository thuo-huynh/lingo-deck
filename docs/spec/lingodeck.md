---
status: ready-for-agent
source: SPEC_SRS_LANGUAGE_LEARNING.md v1.0 + LingoDeck Design System (bản mới nhất)
---

# LingoDeck — spec theo hiện trạng

## Problem Statement

Người học Việt Nam muốn nhớ từ vựng ngoại ngữ lâu dài nhưng:

- Học kiểu flashcard đơn thuần chỉ luyện *nhận biết*, không luyện *viết* và *nghe*. Họ tưởng đã thuộc nhưng không gõ hay nghe ra được.
- Ứng dụng kiểu Anki tùy biến mạnh nhưng khó dùng, giao diện khô. Ứng dụng kiểu Duolingo thân thiện nhưng không cho tự quản lý bộ từ và lịch ôn.
- Lịch ôn sai thời điểm: ôn quá sớm thì phí công, quá muộn thì quên. Điểm số bị thổi phồng khi đếm mỗi bước như một lượt học.
- Họ dùng iPhone là chính và muốn mở app như app thật, nhưng khách hàng không muốn làm app native.

## Solution

Một PWA mobile-first (cài lên màn hình chính iPhone) để học từ theo lịch ôn FSRS:

- Mỗi từ là **một** đơn vị lịch ôn. Mỗi lần gặp từ (một *attempt*), người học vượt qua 1–3 *bước*: Thẻ ghi nhớ → Viết từ (từ nghĩa tiếng Việt) → Nghe & viết. Các bước chỉ là cổng của attempt; lịch FSRS nhận **đúng một** rating mỗi attempt.
- Người học tự tổ chức bộ từ dạng cây (bộ cha, bộ con), thêm từ có ví dụ, gợi ý, âm thanh, tag, hoặc nhập hàng loạt từ CSV.
- Giao diện tiếng Việt, một việc mỗi màn hình, phản hồi đúng/sai rõ ràng không gây xấu hổ. Có chuỗi ngày, mục tiêu ngày, XP nhẹ nhàng, không thưởng cho việc ôn trước hạn.
- Đăng nhập không mật khẩu bằng mã 6 số gửi qua email.

## User Stories

### Tài khoản và bắt đầu

1. Là người mới, tôi muốn đăng nhập bằng email và một mã 6 số, để không phải nhớ mật khẩu.
2. Là người dùng iPhone, tôi muốn ô nhập mã tự gợi ý mã từ email (one-time-code), để đăng nhập bằng một chạm.
3. Là người dùng, tôi muốn mã tự gửi đi khi gõ đủ 6 số, để không phải bấm thêm nút.
4. Là người dùng, tôi muốn đổi email nếu gõ nhầm trước khi nhập mã, để không bị kẹt.
5. Là người dùng, tôi muốn thấy thông báo rõ ràng khi mã sai hoặc hết hạn, để biết cần xin mã mới.
6. Là chủ sản phẩm, tôi muốn mã bị khóa sau 5 lần nhập sai, để không ai dò được mã.
7. Là chủ sản phẩm, tôi muốn giới hạn số mã gửi theo email và theo IP, để form đăng nhập không bị dùng để spam email.
8. Là người dùng, tôi muốn tài khoản được tạo tự động ở lần đăng nhập đầu, để không có bước đăng ký riêng.
9. Là người dùng, tôi muốn giữ đăng nhập lâu (90 ngày) trên app đã cài, để không phải đăng nhập lại liên tục.
10. Là người mới, tôi muốn chọn ngôn ngữ học (Anh, Nhật, Hàn, Trung, Pháp), để app chuẩn bị đúng bộ từ.
11. Là người mới, tôi muốn chọn số từ mới mỗi ngày (5/10/20), để học vừa sức.
12. Là người mới, tôi muốn chọn số bước luyện mỗi từ (1/2/3), để cân bằng giữa nhanh và nhớ chắc.
13. Là người mới học tiếng Anh, tôi muốn có sẵn một bộ từ mẫu, để học thử ngay không cần nhập từ.
14. Là người mới, tôi muốn kết thúc onboarding bằng việc học thử 1 từ, để hiểu ngay cách app hoạt động.
15. Là người dùng, tôi muốn chạy lại onboarding mà không bị tạo thêm bộ từ mẫu thứ hai, để dữ liệu không bị trùng.
16. Là người dùng, tôi muốn đăng xuất trong Cài đặt.

### Trang chủ

17. Là người học, tôi muốn thấy hôm nay có bao nhiêu từ Đến hạn, Mới, Đang học, để biết khối lượng hôm nay.
18. Là người học, tôi muốn số đếm là số **từ**, không nhân ba theo số bước, để con số phản ánh đúng.
19. Là người học, tôi muốn thấy tiến độ mục tiêu ngày (số từ đã học / mục tiêu), để có động lực hoàn thành.
20. Là người học, tôi muốn thấy chuỗi ngày học liên tiếp, và hôm nay chưa học thì chuỗi chưa bị mất.
21. Là người thức khuya, tôi muốn ngày học bắt đầu từ một giờ tôi chọn (mặc định 4:00) theo múi giờ của tôi, để 1 giờ sáng vẫn tính là "hôm qua".
22. Là người học, tôi muốn một nút "Học hôm nay" đưa thẳng vào thiết lập buổi học.
23. Là người học, tôi muốn thấy các bộ từ gần đây kèm số từ Mới/Ôn, để nhảy vào bộ đang học dở.
24. Là người học đã xong việc hôm nay, tôi muốn thấy "Hết từ cần ôn hôm nay" và gợi ý Luyện tập thêm không ảnh hưởng lịch, để không bị kéo vào ôn trước hạn.
25. Là người chưa có bộ từ nào, tôi muốn thấy nút tạo bộ từ đầu tiên.

### Bộ từ

26. Là người học, tôi muốn tạo bộ từ có tên, mô tả, màu, để phân loại.
27. Là người học, tôi muốn tạo bộ con trong bộ khác, không giới hạn số tầng, để sắp xếp theo chủ đề và cấp độ.
28. Là người học, tôi muốn xem thư viện bộ từ dạng cây, bộ con thụt vào dưới bộ cha, mỗi bộ kèm số từ, Mới, Ôn.
29. Là người học, tôi muốn số đếm của bộ cha gồm cả từ trong bộ con nhưng không đếm trùng.
30. Là người học, tôi muốn đổi tên, đổi màu, chuyển bộ sang bộ cha khác, và lịch ôn của các từ vẫn giữ nguyên.
31. Là người học, tôi muốn app chặn việc chuyển một bộ vào chính bộ con của nó.
32. Là người học, tôi muốn xoá bộ từ có xác nhận; bộ và bộ con được lưu trữ, lịch sử ôn không mất.
33. Là người học, tôi muốn xem chi tiết bộ: đường dẫn bộ cha, tổng số từ, đến hạn, mới, danh sách bộ con.
34. Là người học, tôi muốn tìm từ trong bộ theo từ, nghĩa hoặc tag.
35. Là người học, tôi muốn thấy trạng thái từng từ (Mới, Đang học, Ôn, Học lại, Tạm dừng).
36. Là người học, tôi muốn bộ từ mới tự nhận một màu khác các bộ đã có.

### Từ vựng

37. Là người học, tôi muốn thêm từ chỉ với hai ô bắt buộc (từ, nghĩa tiếng Việt), để thêm thật nhanh.
38. Là người học, tôi muốn mở "Thêm chi tiết" để nhập phiên âm, từ loại, câu ví dụ và bản dịch, gợi ý, ghi chú, tag.
39. Là người học, tôi muốn khai báo các cách viết khác được chấp nhận (color / colour), để không bị chấm sai oan.
40. Là người học, tôi muốn tải lên file âm thanh phát âm (tối đa 5 MB), hoặc nghe thử giọng đọc của thiết bị.
41. Là người học, tôi muốn "Lưu & thêm tiếp" để nhập nhiều từ liền mạch.
42. Là người học, tôi muốn sửa từ và chuyển từ sang bộ khác mà không mất tiến độ.
43. Là người học, tôi muốn tạm dừng một từ để nó không xuất hiện khi học, và tiếp tục lại sau.
44. Là người học, tôi muốn "Học lại từ đầu" một từ (có xác nhận), lịch sử ôn cũ vẫn được giữ.
45. Là người học, tôi muốn xoá từ (lưu trữ), lịch sử ôn vẫn còn.
46. Là người học, tôi muốn xem tiến độ của một từ: trạng thái, lần ôn tiếp theo, số lượt ôn, số lần quên.
47. Là người tạo nội dung, tôi muốn nhập từ CSV, xem trước dòng hợp lệ / trùng / lỗi kèm lý do trước khi nhập.
48. Là người tạo nội dung, tôi muốn tải file CSV mẫu để biết đúng định dạng.
49. Là người tạo nội dung, tôi muốn dòng trùng (trong bộ hoặc trong chính file) và dòng lỗi tự bị bỏ qua.
50. Là người dùng, tôi muốn xuất bộ từ (gồm bộ con) ra CSV để không bị khoá dữ liệu.

### Thiết lập buổi học

51. Là người học, tôi muốn chọn bộ từ và có bao gồm bộ con hay không.
52. Là người học, tôi muốn chọn số từ (theo hạn mức hôm nay, 5, 10, 20, 50).
53. Là người học, tôi muốn chuyển nhanh 1 / 2 / 3 bước ngay trước khi học, và thấy chuỗi bước sẽ luyện.
54. Là người học, tôi muốn chọn chế độ: Ôn theo lịch, Luyện tập (không đổi lịch), Từ sai hôm nay (không đổi lịch).
55. Là người học, tôi muốn được báo khi không còn từ phù hợp, kèm gợi ý chế độ Luyện tập.

### Học

56. Là người học, tôi muốn thanh tiến độ trên cùng đếm số **từ** đã xong trong buổi, còn nhãn "Bước 2/3" chỉ tiến độ trong từ hiện tại.
57. Là người học, ở bước Thẻ ghi nhớ, tôi muốn thấy từ và phiên âm, tự nhớ nghĩa rồi lật thẻ.
58. Là người học, sau khi lật, tôi muốn thấy nghĩa, từ loại, tag, ảnh, câu ví dụ có tô đậm từ, ghi chú.
59. Là người học, tôi muốn tự đánh giá Chưa nhớ / Khó / Nhớ / Rất dễ, mỗi mức có icon và chữ, không chỉ màu.
60. Là người học chỉ dùng 1 bước, tôi muốn thấy trước khoảng ôn tiếp theo trên mỗi nút đánh giá.
61. Là người học, ở bước Viết từ, tôi muốn thấy nghĩa tiếng Việt, từ loại, tag rồi gõ từ ở ngôn ngữ đích.
62. Là người học, tôi muốn đáp án được chấm không phân biệt hoa/thường (trừ khi tôi bật), bỏ qua khoảng trắng thừa, nhưng không bỏ dấu.
63. Là người học, khi sai, tôi muốn thấy đáp án đúng có gạch chân đúng phần khác với chữ tôi gõ, và chữ tôi đã gõ vẫn được giữ.
64. Là người học, tôi muốn xin gợi ý từng cấp (gợi ý riêng, chữ cái đầu, số chữ cái, điền khuyết, câu ví dụ che từ). Không gợi ý nào lộ nguyên đáp án.
65. Là người học, tôi muốn hiểu rằng dùng gợi ý thì lượt đó tối đa là "Khó", còn bấm Xem đáp án thì tính là chưa nhớ.
66. Là người học, ở bước Nghe & viết, tôi muốn chỉ thấy nút phát, phát chậm và ô nhập, không lộ từ, phiên âm hay transcript.
67. Là người học, tôi muốn âm thanh tự phát khi vào bước nếu thiết bị cho phép, và luôn phát lại được không giới hạn.
68. Là người học, khi thiết bị không đọc được, tôi muốn bỏ qua từ đó mà không bị tính đúng hay sai.
69. Là người học, tôi muốn sai ở bất kỳ bước nào thì dừng chuỗi bước, và từ đó quay lại sau trong buổi (tối đa 3 lần).
70. Là người học, tôi muốn lượt ôn lại trong cùng buổi, khi từ chưa đến hạn, không làm thay đổi lịch ôn chính.
71. Là người dùng bàn phím, tôi muốn Enter để lật/kiểm tra/tiếp tục, phím 1–4 để đánh giá, Space để phát âm thanh, Esc để thoát.
72. Là người gõ tiếng Nhật/Hàn/Trung, tôi muốn Enter khi đang ghép chữ (IME) không nộp đáp án dở.
73. Là người học, tôi muốn thoát giữa buổi có xác nhận, phần đã trả lời được lưu, và học tiếp đúng chỗ sau khi tải lại trang.
74. Là người học có mạng chập chờn, tôi muốn bấm hai lần hoặc gửi lại không làm tính trùng lượt ôn hay XP.
75. Là người học mở hai tab, tôi muốn hai tab không ghi đè lịch ôn của cùng một từ.
76. Là người học, cuối buổi tôi muốn thấy số từ đã học, % đúng lần đầu, XP, và số từ sẽ quay lại sớm.
77. Là người dùng tắt hiệu ứng chuyển động, tôi muốn app tôn trọng chế độ giảm chuyển động của hệ thống.

### Lịch ôn

78. Là người học, tôi muốn lịch ôn dùng FSRS (ts-fsrs) với tỉ lệ nhớ mong muốn mặc định 90%.
79. Là người học, tôi muốn từ mới đi qua learning steps (mặc định 1 phút, 10 phút) và chỉ được ôn khi bước đó thực sự đến hạn.
80. Là người học, tôi muốn từ ôn (REVIEW) đến hạn trong ngày học được tính là việc hôm nay.
81. Là người học, tôi muốn giới hạn từ mới/ngày (mặc định 10) và lượt ôn/ngày (mặc định 100). Phần còn tồn không bị mất.
82. Là người học, tôi muốn chọn thứ tự: ôn trước, mới trước, hoặc trộn.
83. Là người học, tôi muốn từ bị tạm dừng không bao giờ vào hàng đợi.
84. Là người học, tôi muốn khoảng ôn tối đa là trần cứng.
85. Là người học, tôi muốn đổi cài đặt mà không làm mất tiến độ; cài đặt mới chỉ áp cho các lượt sau, buổi đang học giữ nguyên.

### Cài đặt

86. Là người học, tôi muốn một preset "Mặc định" (tab Cài đặt) áp cho mọi bộ từ chưa có cài đặt riêng.
87. Là người học, tôi muốn đặt cài đặt riêng cho một bộ; bộ con kế thừa trừ khi có cài đặt riêng, và có thể quay về kế thừa.
88. Là người học, tôi muốn chỉnh: từ mới/ngày, ôn tối đa/ngày, bước mặc định, tự phát âm thanh, cho phép gợi ý, hiện phiên âm.
89. Là người học nâng cao, tôi muốn chọn và sắp xếp lại bước tuỳ ý (ít nhất 1, không trùng), chỉnh tỉ lệ nhớ, learning/relearning steps, khoảng ôn tối đa, phân biệt hoa/thường, thứ tự trong ngày.
90. Là người học, tôi muốn đặt tên hiển thị, mục tiêu từ/ngày và giờ bắt đầu ngày mới.

### Thống kê

91. Là người học, tôi muốn thấy chuỗi ngày, tổng số từ, số từ đã thuộc.
92. Là người học, tôi muốn thấy tỉ lệ nhớ 30 ngày gần nhất, chỉ tính các lượt ôn theo lịch của từ đã thuộc, kèm số lượt làm mẫu (hoặc "chưa đủ dữ liệu").
93. Là người học, tôi muốn biểu đồ số từ đã học mỗi ngày trong 14 ngày; người dùng screen reader nhận cùng dữ liệu dạng bảng.

### App trên iPhone

94. Là người dùng iPhone, tôi muốn thêm app vào Màn hình chính và mở toàn màn hình, có icon và màu thanh trạng thái đúng chế độ sáng/tối.
95. Là người dùng, tôi muốn giao diện tránh tai thỏ và thanh home (safe area), và ô nhập không làm iOS tự phóng to.
96. Là người dùng, khi mất mạng tôi muốn thấy trang "Bạn đang ngoại tuyến" có nút thử lại, thay vì trang lỗi trắng.
97. Là người dùng, tôi muốn app tự theo chế độ sáng/tối của máy.
98. Là người dùng, tôi muốn thanh điều hướng nổi chỉ có icon, tab đang chọn có nền tròn, và nút "+" để Thêm từ / Tạo bộ từ (hoặc Thêm bộ con) / Nhập CSV.

### Bảo mật và dữ liệu

99. Là người dùng, tôi muốn không ai khác xem hay sửa được bộ từ, từ, buổi học hay file âm thanh của tôi.
100. Là người dùng, tôi muốn file âm thanh/ảnh riêng tư, chỉ mở được qua link có chữ ký, hết hạn sau một giờ.

## Implementation Decisions

**Nền tảng**

- Next.js 16 App Router + TypeScript, shadcn/ui (radix) + Tailwind 4, MongoDB Atlas (driver gốc, không ORM), Cloudflare R2 (S3 API), ts-fsrs, Zod.
- Tắt `cacheComponents`: mọi trang đều nằm sau đăng nhập và động, cache component chỉ thêm phức tạp.
- Đọc dữ liệu bằng Server Components gọi thẳng tầng service. Ghi dữ liệu qua Route Handlers `/api/v1/...` từ client. Mọi lỗi nghiệp vụ trả JSON `{ error }` bằng tiếng Việt; lỗi lạ trả 500 chung, không lộ chi tiết.
- `proxy` (thay middleware ở Next 16) chỉ kiểm tra lạc quan là cookie có tồn tại. Phân quyền thật nằm ở tầng dữ liệu: mọi truy vấn lọc theo `ownerId`/`userId`.

**Xác thực**

- Email OTP tự viết, không dùng Auth.js. Mã 6 số từ CSPRNG, lưu dạng HMAC-SHA256 (khoá là `SESSION_PASSWORD`), hết hạn sau 10 phút (TTL index), so sánh constant-time, 5 lần thử. Giới hạn 5 mã/email và 10 mã/IP trong khung thời hạn của mã.
- Phiên là cookie mã hoá (iron-session), httpOnly, sameSite=lax, secure ở production, TTL 90 ngày.
- Gửi mail qua Resend bằng `fetch`. Thiếu key ở dev thì mã in ra log server; thiếu key ở production thì báo lỗi.

**Mô hình dữ liệu (Mongo)**

- `users`: email (unique), timezone, dayStartHour, dailyGoal, onboarded, `defaultSettings` (preset "Mặc định").
- `decks`: `parentId` và `path` (tổ tiên + chính nó, gốc trước) để một truy vấn lấy được cả cây con. `settings` có thể null (kế thừa), `archivedAt`.
- `vocab`: một home deck, `deckPath` sao chép từ deck để lọc theo phạm vi. Ví dụ, gợi ý, tag được nhúng. `acceptedAnswers` luôn chứa `term` ở đầu. `status` là active/suspended/archived. Trạng thái SRS được **nhúng** (`srs`: card ts-fsrs, due, state, `revision`, introducedAt), vì mỗi từ thuộc đúng một người học, nên cập nhật lịch là thao tác trên một document.
- `sessions`: snapshot `steps` và `settings` lúc bắt đầu. `items[]`: mỗi item là **một attempt** (vocabId, results theo bước, rating, status). Từ sai được thêm lại cuối danh sách thành item mới.
- `reviewLogs`: `attemptKey` = sessionId:itemIndex với **unique index**, lưu trạng thái SRS trước/sau, `rescheduleMode`, phiên bản thuật toán.
- `otps`: email, ip, codeHash, expiresAt (TTL), tries.
- Dùng `ignoreUndefined` trên client Mongo để field rỗng không bị lưu thành null.

**Các module sâu (deep modules)**

- *Rating policy* `evaluateAttempt(steps, results)` → `{ in_progress, nextStep } | { done, rating }`. Bất kỳ bước nào sai, bấm Xem đáp án hoặc flashcard Again thì ra Again. Có dùng gợi ý hoặc flashcard Hard thì ra Hard. Flashcard Easy và mọi bước sạch thì ra Easy. Còn lại là Good. Gõ đúng không bao giờ tự cho Easy.
- *Chấm đáp án* `checkAnswer(input, accepted, { caseSensitive, locale })`: NFC, trim, gộp khoảng trắng, hạ chữ theo locale. Không bỏ dấu, giữ thứ tự từ.
- *FSRS adapter* `newSrs(now)`, `schedule(srs, rating, now, settings)`: tắt fuzz để kết quả tái dựng được từ log. Tự kẹp `maximumInterval` vì ts-fsrs có thể vượt trần thêm 1 ngày. Tăng `revision` mỗi lần.
- *Phiên học* `createSession` / `submitStep` / `finishSession`:
  - Hàng đợi DAILY lấy REVIEW đến hạn trước cuối ngày học, và LEARNING/RELEARNING khi `due <= now`. Trừ đi số đã ôn và số từ mới đã giới thiệu hôm nay.
  - CUSTOM (Luyện tập, Từ sai hôm nay) mặc định là `practice_only`.
  - Server chấm bước gõ, server quyết định rating. Không tin rating client gửi.
  - Finalize trong **một transaction**: cập nhật item (có guard trạng thái và độ dài results), ghi review log, cập nhật `srs` với optimistic lock trên `revision`.
  - Ôn lại trong buổi khi từ learning chưa đến hạn thì ghi log `practice_only`, không đổi lịch.
  - Gửi lại một attempt đã xong trả về kết quả đã lưu, không ghi gì thêm.
- *View phiên học*: chỉ gửi cho client dữ liệu của bước hiện tại. Bước gõ không có `term`. Bước nghe có `speech` (text cho TTS của trình duyệt) nhưng không hiển thị. Gợi ý được tạo phía server và không chứa nguyên đáp án.
- *Ngày học* `studyDay(now, timezone, dayStartHour)` → key/start/end, đúng cả khi có DST. Dùng cho quota, chuỗi ngày, thống kê.
- *Thống kê*: số đếm theo deck bằng một aggregation unwind `deckPath` (mỗi từ một home deck nên không đếm trùng). Quy tắc "đến hạn" giống hệt hàng đợi. Chuỗi ngày tính từ review logs theo study day.
- *CSV*: parser RFC 4180 (dấu ngoặc, xuống dòng trong ô, BOM). `previewImport` đánh dấu ok/duplicate/error theo dòng. Commit chạy lại validation phía server qua cùng schema của trình sửa từ, rồi `insertMany`. Giới hạn 1 MB / 2000 dòng. Export cùng bộ cột.

**Cài đặt học**

- Thứ tự áp dụng: bộ hiện tại → bộ cha → … → preset "Mặc định" của người dùng → mặc định sản phẩm (10 mới/ngày, 100 ôn/ngày, 3 bước, ôn trước, retention 0.9, learning 1m/10m, relearning 10m, khoảng ôn tối đa 36500 ngày).
- Không có collection preset dùng chung, không có clone preset.

**API (`/api/v1`)**

- `auth/request-otp`, `auth/verify-otp`, `auth/logout`
- `me` (PATCH), `me/settings` (PUT), `onboarding` (POST)
- `decks` (POST); `decks/:id` (PATCH, DELETE = lưu trữ); `decks/:id/settings` (PUT, null = kế thừa); `decks/:id/import` (POST, `commit` true/false); `decks/:id/export` (GET CSV)
- `vocabulary` (POST); `vocabulary/:id` (PUT sửa; POST suspend/unsuspend/reset; DELETE = lưu trữ)
- `study/sessions` (POST); `study/sessions/:id` (GET view); `study/sessions/:id/steps` (POST); `study/sessions/:id/finish` (POST)
- `media/upload-url` (POST: presigned PUT, key có tiền tố userId); `media/*key` (GET: chỉ chủ sở hữu, redirect sang signed GET 1 giờ)

**PWA**

- Manifest qua file convention, icon PNG (kèm maskable), apple-icon, `appleWebApp`, `viewportFit=cover`, themeColor theo sáng/tối.
- Service worker tự viết, kiểu online-first: cache-first cho `/_next/static`, điều hướng thất bại thì trả `offline.html`. Không cache API hay trang, vì trạng thái SRS phải luôn mới.
- Âm thanh: ưu tiên file đã upload, nếu không có thì dùng SpeechSynthesis của trình duyệt. Autoplay bị iOS chặn không tính là lỗi.

**Giao diện**

- Token theo design: Be Vietnam Pro 400/500/600; xanh ngọc #0E7C72 (tối #3CC4B4); 4 màu đánh giá cố định, có bản nền nhạt; bo góc thẻ 20, nút 14, ô nhập 12; nút chính cao 52px; vùng chạm tối thiểu 44px.
- Chế độ tối theo `prefers-color-scheme`.

## Testing Decisions

- Một test tốt kiểm tra hành vi qua interface công khai và lấy giá trị mong đợi từ spec hoặc ví dụ cụ thể, không tính lại theo cách code tính. Không mock các thành phần bên trong.
- Phải dùng **MongoDB thật** (replica set in-memory qua mongodb-memory-server, xoá dữ liệu giữa các test), vì transaction và unique index là một phần của hành vi cần kiểm.
- Các seam đang có test:
  - Rating policy (logic thuần): AC-02, 03, 04, 05; Easy không đến từ việc gõ đúng.
  - Chấm đáp án (logic thuần): Unicode, hoa/thường, khoảng trắng, giữ dấu, giữ thứ tự từ.
  - FSRS adapter: vòng New → Learning → Review → Relearning, trần khoảng ôn.
  - Ngày học: giờ bắt đầu ngày theo múi giờ, ngày có DST.
  - Service phiên học (tích hợp Mongo): AC-02, 03, 07, 08, 09, 10, 12, 13, 14; learning step không bị ôn sớm (từ hàng đợi lẫn ôn lại trong buổi).
  - OTP (tích hợp): tạo tài khoản một lần, mã sai/dùng lại, khoá sau 5 lần, giới hạn theo email và theo IP.
  - Thống kê (tích hợp): chuỗi ngày, ranh giới ngày học, không đếm trùng bộ con.
  - CSV: parser và preview (thuần); import/export (tích hợp) gồm preview không ghi, commit chỉ chèn dòng hợp lệ, nhập lại không trùng, chặn deck của người khác.
  - Diff đáp án: gạch chân đúng chữ thiếu hoặc sai.
- Seam ưu tiên cho test mới là **service phiên học** (`createSession` / `submitStep`): đây là seam cao nhất, gần hành vi người dùng nhất, không cần dựng UI.
- Chưa có test E2E (Playwright). Luồng UI đã được kiểm thủ công trên trình duyệt ở viewport mobile.

## Out of Scope

- Offline-first đầy đủ và đồng bộ xung đột nhiều thiết bị (P2).
- Import `.apkg` của Anki, đồng bộ 2 chiều với Anki.
- Thư viện bộ từ công khai, chia sẻ bộ từ, cộng tác.
- Tối ưu tham số FSRS theo lịch sử cá nhân.
- TTS chất lượng cao sinh sẵn phía server. Hiện chỉ dùng TTS của trình duyệt và file người dùng tải lên.
- Đăng nhập Google / magic link (design có, nhưng khách hàng đã chọn email OTP).
- Preset dùng chung có tên, clone preset, chia sẻ preset giữa nhiều bộ.
- Lọc Custom Study theo tag trên UI (API đã hỗ trợ `filter: tag`). Chế độ "Weak words", "Extra new/review" vượt quota.
- Leech detection, review ahead có lập lịch, heatmap, thống kê theo từng kỹ năng/bước.
- Web push notification, chấm phát âm bằng micro, AI gợi ý ví dụ.
- Ngôn ngữ giao diện ngoài tiếng Việt.

## Further Notes

**Khác biệt so với spec gốc của khách (cần khách duyệt):**

- Postgres/Supabase + RLS được thay bằng MongoDB + phân quyền ở tầng service. Các bảng con (examples, hints, tags, card_srs_states, step_attempts) được nhúng vào document.
- Đăng nhập bằng email OTP thay cho magic link/OAuth, khác cả design (nút Google, "Gửi link đăng nhập").
- Preset là cài đặt nhúng theo cây bộ từ cộng với preset "Mặc định" của người dùng, thay cho bảng `study_presets` dùng chung.
- Ô "Mới" trên Trang chủ giới hạn theo mục tiêu ngày của người dùng, còn hàng đợi giới hạn theo `newPerDay` của cài đặt bộ từ. Hai số này có thể lệch nhau.
- Từ nhập qua CSV lấy ngôn ngữ của từ gần nhất trong cùng cây bộ từ (mặc định en-US).

**Rủi ro đã biết:**

- TTS của trình duyệt buộc phải gửi từ cần đọc xuống thiết bị ở bước Nghe. Từ đó không hiển thị nhưng có thể đọc được trong dữ liệu mạng. Spec gốc chấp nhận điều này.
- Chưa xác nhận presigned PUT của R2 thực sự chặn file lớn hơn 5 MB.
- Chưa thử trên iPhone thật: giọng TTS của iOS, cookie ở chế độ standalone, bàn phím ảo che nút.

**Chạy local:** `npm run dev:db` (Mongo replica set ở cổng 27027) và `npm run dev`. Xem README.
