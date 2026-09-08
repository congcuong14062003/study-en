# EnglishMaster

MVP học tiếng Anh cho người Việt, chạy bằng **Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, các primitive shadcn/Radix, Prisma và PostgreSQL thật**. Mã nguồn được chia theo component, service và API; không dùng localStorage làm cơ sở dữ liệu học tập.

## Chạy ngay trên máy hiện tại

Yêu cầu Node.js 22.12+ hoặc 24, pnpm 11.

```powershell
pnpm install
pnpm db:local
```

Giữ terminal database đang chạy. Lần đầu, lệnh tự tạo `.env` với mật khẩu database và secret ngẫu nhiên. PostgreSQL chỉ nghe ở `127.0.0.1:54329`; dữ liệu được giữ trong `.local-db/`.

Mở terminal thứ hai:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Mở **http://127.0.0.1:3000**. Dùng đúng origin này để khớp cấu hình chống CSRF. Nếu đổi cổng/hostname, cập nhật `NEXTAUTH_URL` rồi khởi động lại.

Tài khoản demo cục bộ:

| Vai trò | Email | Mật khẩu mặc định trong chế độ local |
|---|---|---|
| Học viên | `demo@englishmaster.vn` | `LearnEnglish!2026` |
| Quản trị | `admin@englishmaster.vn` | `LearnEnglish!2026` |

Mật khẩu seed lấy từ `DEMO_PASSWORD`. Không đưa tài khoản demo lên môi trường công khai. Seed không ghi đè mật khẩu tài khoản đã tồn tại. Các số liệu của tài khoản demo là lịch sử mẫu; tài khoản đăng ký mới bắt đầu từ 0.

Nếu đã có PostgreSQL, điền `DATABASE_URL` trong `.env`, bỏ qua `db:local` và chạy migration/seed. `docker-compose.yml` cũng cung cấp PostgreSQL 17; đặt `POSTGRES_PASSWORD` trước khi chạy.

## Những luồng đã triển khai

- Landing, đăng nhập email/mật khẩu, đăng ký có validation, ghi nhớ đăng nhập, OAuth tùy cấu hình, khôi phục mật khẩu qua SMTP.
- Onboarding mục tiêu/trình độ/thời gian, bài kiểm tra đầu vào 30 câu và kết quả CEFR ước tính theo 4 kỹ năng.
- Dashboard, đăng ký khóa học, bài học 6 phần, lưu từng bước, nộp quiz và giải thích đáp án.
- Từ vựng, phát âm, từ điển nội bộ, flashcard lật bằng click/Space, phím 1–4 và lịch ôn SM-2 điều chỉnh.
- Ngữ pháp, nghe bằng TTS hoặc URL bản thu, đọc có tra từ, ghi âm/nhận dạng lời nói, viết và lưu bản nháp.
- AI Tutor theo tình huống, giọng nói để nhập tin, lịch sử hội thoại, đánh giá bài viết theo JSON schema khi có API key.
- XP, streak theo múi giờ Việt Nam, huy hiệu, bảng xếp hạng tự nguyện, lịch học, heatmap, thống kê và gợi ý theo điểm kỹ năng.
- Yêu thích, ghi chú CRUD, hồ sơ/cài đặt, dark/light/system, nhắc học trong ứng dụng khi mở dashboard sau giờ đã chọn.
- Admin RBAC, tìm kiếm/lọc bảng, CRUD khóa học/bài học/từ vựng/ngữ pháp/bài nghe/bài đọc/câu hỏi, xuất bản/bản nháp, khóa/xóa học viên, cấp/thu hồi Premium thủ công.
- Upload ảnh bìa PNG/JPEG/WebP, thư viện bài viết, bảng giá và lưu sự quan tâm Premium. Không tạo giao dịch thanh toán giả.

Seed có **3 khóa học, 12 bài học, 36 từ vựng, 17 chủ điểm ngữ pháp, 5 bài nghe, 5 bài đọc và 60 câu hỏi**.

## Cấu trúc và API

```text
src/app/                  App Router, trang công khai, workspace, API
src/components/           UI, layout, dashboard, course, learning, quiz, AI, admin
src/hooks/                Tải dữ liệu và quản lý trạng thái
src/lib/                  Auth, Prisma, Zod, bảo vệ request
src/services/             XP, quiz, SRS, thời gian học, phân quyền, AI, CMS
src/types/                Kiểu session và Web Speech
prisma/                   Schema, migration, nội dung và seed
scripts/                  PostgreSQL local, kiểm thử tích hợp, tạo admin
tests/                    Các bất biến của thuật toán và nội dung
docs/ARCHITECTURE.md       Kiến trúc, routes, components và thiết kế dữ liệu
```

Các API chính: `/api/auth/register`, `/api/courses`, `/api/courses/:id/enroll`, `/api/lessons/:id`, `/api/lessons/:id/progress`, `/api/quiz/:id`, `/api/quiz/submit`, `/api/vocabulary`, `/api/vocabulary/review`, `/api/dashboard`, `/api/notes`, `/api/favorites`, `/api/ai/chat`, `/api/writing/analyze`, `/api/speaking/analyze`, `/api/admin/:module`.

Mutation dùng JSON và kiểm tra `Origin`; upload dùng multipart. API riêng của NextAuth sử dụng CSRF token của NextAuth. Đáp án quiz không được gửi trước khi nộp. Server kiểm tra enrollment và Premium hiện hành, tính điểm và ghi XP trong transaction khóa theo người dùng. Nộp đồng thời không cộng trùng XP; kết thúc phiên học lặp lại không cộng trùng thời gian; các khoảng thời gian chồng nhau được gộp.

## Kiểm tra

```powershell
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

Kiểm thử tích hợp yêu cầu database đã seed và server đang chạy tại `NEXTAUTH_URL` (hoặc `TEST_BASE_URL`). Nó tạo tài khoản có email `@example.test`, kiểm tra API rồi xóa dữ liệu đó. Bao gồm đăng ký, đăng nhập, RBAC, CSRF, placement, enrollment, tiến độ, nộp quiz đồng thời, SRS, quyền sở hữu ghi chú, lưu yêu thích, thời gian học, đăng nhập lại, admin CRUD và thu hồi session.

Kết quả xác minh ngày 07/09/2026 với Node 24: 9/9 kiểm thử logic đạt; bộ kiểm thử tích hợp đạt; build production Webpack và kiểm tra TypeScript đạt. HTTP smoke test cho health, trang chủ, đăng nhập, khóa học, bảng giá và blog đều trả 200. Migration PostgreSQL đã đồng bộ.

Chưa thực hiện kiểm thử tương tác bằng trình duyệt trong phiên xây dựng này. Micro, voice recognition, TTS, OAuth, email và AI cần được kiểm tra trên trình duyệt và tài khoản dịch vụ thực trước khi phát hành.

## Cấu hình dịch vụ

Sao chép các khóa cần thiết từ `.env.example`; không đưa secret vào frontend hoặc Git.

- **Google/Facebook:** client ID và secret. Callback: `/api/auth/callback/google` hoặc `/api/auth/callback/facebook`. Nút đăng nhập chỉ xuất hiện khi cấu hình đủ.
- **AI:** `OPENAI_API_KEY`, tùy chọn `OPENAI_MODEL` (mặc định `gpt-4.1-mini`). Request chỉ chạy phía server, dùng Responses API với `store:false`; bài viết dùng structured output rồi kiểm tra lại bằng Zod. Chưa có key thì API trả 503 có giải thích. Có quota chống lạm dụng.
- **Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Token reset được băm SHA-256, hết hạn sau 30 phút, chỉ dùng một lần; đổi mật khẩu làm mất hiệu lực session cũ.
- **Proxy:** chỉ bật `TRUST_PROXY=true` khi reverse proxy do bạn quản lý **ghi đè** `X-Real-IP`. Khi đó có thêm giới hạn theo IP ngoài giới hạn tài khoản và ngưỡng bảo vệ tổng. Môi trường công khai nên có rate limiting tại proxy.

Tạo quản trị viên cho môi trường riêng bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` và `pnpm admin:create`. Mật khẩu không được ghi ra terminal.

## Triển khai

```powershell
pnpm build
pnpm start
```

Hoặc dùng Dockerfile đi kèm và PostgreSQL được quản lý riêng. Cung cấp `DATABASE_URL`, `NEXTAUTH_URL` và `NEXTAUTH_SECRET` ở runtime; chạy `prisma migrate deploy` trước khi phục vụ người dùng. Thư mục `public/uploads` cần volume bền vững khi chạy một instance. Chuyển upload sang object storage trước khi chạy nhiều instance.

Chưa triển khai lên Internet. Stack Node.js/PostgreSQL trong yêu cầu hiện chạy cục bộ; không chuyển sang SQLite hay Vinext để phù hợp Cloudflare Sites. Muốn publish cần host Node.js/container và PostgreSQL có thể truy cập từ host đó.

## Phạm vi MVP và phần cần hoàn thiện trước khi mở thương mại

- Chưa nối cổng thanh toán/webhook; Premium có thể cấp thủ công bởi admin. Trang bảng giá ghi rõ mức giá dự kiến và không thu tiền.
- Speaking chấm **độ khớp văn bản nhận dạng**, không giả lập điểm phát âm, độ trôi chảy hoặc ngữ điệu. Muốn chấm các chỉ số đó cần dịch vụ phân tích âm thanh.
- UI hiện bằng tiếng Việt. Nội dung học tiếng Anh có bản dịch; chưa có bản dịch toàn bộ giao diện sang tiếng Anh.
- Quiz MVP dùng trắc nghiệm một đáp án. Chưa có đầy đủ dạng nối từ, tự luận, gõ từ và bộ đề IELTS/TOEIC/TOEFL riêng.
- Gợi ý học hiện dựa trên điểm kỹ năng đã lưu; chưa dùng mô hình AI để tối ưu lộ trình. CEFR là ước tính tham khảo, không phải chứng chỉ.
- Từ điển dùng thư viện nội bộ đã seed; không tra mọi từ bên ngoài. History tra từ và theme chỉ là tùy chọn trên thiết bị.
- Nhắc học là thông báo trong ứng dụng, chưa có push/email chạy nền. Bài viết AI được lưu nhưng chưa có màn hình lịch sử bài viết riêng.
- Các khóa và nội dung là bộ khởi đầu, chưa phải giáo trình đầy đủ mọi trình độ. Chưa kiểm thử tải, vận hành nhiều instance, email/OAuth/AI thật hoặc thanh toán.

Tài liệu tham chiếu: [NextAuth](https://next-auth.js.org/configuration/options), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
