# EnglishMaster

MVP học tiếng Anh cho người Việt, chạy bằng **Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, các primitive shadcn/Radix, Prisma và PostgreSQL thật**. Mã nguồn được chia theo component, service và API; không dùng localStorage làm cơ sở dữ liệu học tập.

## Chạy ngay trên máy hiện tại

Yêu cầu Node.js 22.13+ hoặc 24, pnpm 11 và PostgreSQL chạy thường trực ở `localhost:5432`.

```powershell
pnpm install
Copy-Item .env.example .env
```

Tạo database `englishmaster`, cập nhật mật khẩu trong `DATABASE_URL`, sau đó chạy:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Mở **http://localhost:3000**. Dùng đúng origin này để khớp cấu hình chống CSRF. Nếu đổi cổng/hostname, cập nhật `NEXTAUTH_URL` rồi khởi động lại.

Tài khoản demo cục bộ:

| Vai trò  | Email                    | Mật khẩu mặc định trong chế độ local |
| -------- | ------------------------ | ------------------------------------ |
| Học viên | `demo@englishmaster.vn`  | `LearnEnglish!2026`                  |
| Quản trị | `admin@englishmaster.vn` | `LearnEnglish!2026`                  |

Mật khẩu seed lấy từ `DEMO_PASSWORD`. Không đưa tài khoản demo lên môi trường công khai. Seed không ghi đè mật khẩu tài khoản đã tồn tại. Các số liệu của tài khoản demo là lịch sử mẫu; tài khoản đăng ký mới bắt đầu từ 0. Dịch vụ PostgreSQL trên Windows được cấu hình Automatic nên không cần mở thêm terminal database mỗi lần chạy dự án.

## Những luồng đã triển khai

- Landing, đăng nhập email/mật khẩu, đăng ký có validation, ghi nhớ đăng nhập, OAuth tùy cấu hình, khôi phục mật khẩu qua SMTP.
- Onboarding mục tiêu/trình độ/thời gian, bài kiểm tra đầu vào 30 câu và kết quả CEFR ước tính theo 4 kỹ năng.
- Dashboard, đăng ký khóa học, bài học 6 phần, lưu từng bước, nộp quiz và giải thích đáp án.
- Từ vựng, phát âm, từ điển nội bộ, flashcard lật bằng click/Space, phím 1–4 và lịch ôn SM-2 điều chỉnh.
- Ngữ pháp, nghe bằng TTS hoặc URL bản thu, đọc có tra từ, ghi âm/nhận dạng lời nói, viết và lưu bản nháp.
- AI Tutor theo tình huống và CEFR, nhập bằng giọng nói, sửa lỗi có giải thích tiếng Việt, cụm từ gợi ý, lịch sử/xóa hội thoại và hạn mức theo gói.
- AI Writing chấm 5 tiêu chí, lưu lịch sử phản hồi và bản viết lại; AI Learning Recommendation phân tích quiz, điểm kỹ năng, tiến độ và lịch ôn.
- XP, streak theo múi giờ Việt Nam, huy hiệu, bảng xếp hạng tự nguyện, lịch học, heatmap, thống kê và gợi ý theo điểm kỹ năng.
- Yêu thích, ghi chú CRUD, hồ sơ/cài đặt, dark/light/system, nhắc học trong ứng dụng khi mở dashboard sau giờ đã chọn.
- Admin RBAC, tìm kiếm/lọc bảng, CRUD khóa học/bài học/từ vựng/ngữ pháp/bài nghe/bài đọc/câu hỏi, xuất bản/bản nháp, khóa/xóa học viên, cấp/thu hồi Premium thủ công.
- Upload ảnh bìa PNG/JPEG/WebP, thư viện bài viết, bảng giá và lưu sự quan tâm Premium. Không tạo giao dịch thanh toán giả.

Seed có **16 khóa học, 96 bài học, 1.000 mục từ, 72 chủ điểm ngữ pháp, 21 bài nghe, 21 bài đọc và 132 câu hỏi**.

## Cấu trúc và API

```text
src/app/                  App Router, trang công khai, workspace, API
src/components/           UI, layout, dashboard, course, learning, quiz, AI, admin
src/hooks/                Tải dữ liệu và quản lý trạng thái
src/lib/                  Auth, Prisma, Zod, bảo vệ request
src/services/             XP, quiz, SRS, thời gian học, phân quyền, AI, CMS
src/types/                Kiểu session và Web Speech
prisma/                   Schema, migration, nội dung và seed
scripts/                  Kiểm thử tích hợp và tạo admin
tests/                    Các bất biến của thuật toán và nội dung
docs/ARCHITECTURE.md       Kiến trúc, routes, components và thiết kế dữ liệu
```

Các API chính: `/api/auth/register`, `/api/courses`, `/api/courses/:id/enroll`, `/api/lessons/:id`, `/api/lessons/:id/progress`, `/api/quiz/:id`, `/api/quiz/submit`, `/api/vocabulary`, `/api/vocabulary/review`, `/api/dashboard`, `/api/notes`, `/api/favorites`, `/api/ai/status`, `/api/ai/chat`, `/api/ai/recommendation`, `/api/writing/analyze`, `/api/writing/submissions`, `/api/speaking/analyze`, `/api/admin/:module`.

Mutation dùng JSON và kiểm tra `Origin`; upload dùng multipart. API riêng của NextAuth sử dụng CSRF token của NextAuth. Đáp án quiz không được gửi trước khi nộp. Server kiểm tra enrollment và Premium hiện hành, tính điểm và ghi XP trong transaction khóa theo người dùng. Nộp đồng thời không cộng trùng XP; kết thúc phiên học lặp lại không cộng trùng thời gian; các khoảng thời gian chồng nhau được gộp.

## Kiểm tra

```powershell
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

Kiểm thử tích hợp yêu cầu database đã seed và server đang chạy tại `NEXTAUTH_URL` (hoặc `TEST_BASE_URL`). Nó tạo tài khoản có email `@example.test`, kiểm tra API rồi xóa dữ liệu đó. Bao gồm đăng ký, đăng nhập, RBAC, CSRF, placement, enrollment, tiến độ, nộp quiz đồng thời, SRS, quyền sở hữu ghi chú, lưu yêu thích, thời gian học, đăng nhập lại, admin CRUD và thu hồi session.

Kết quả xác minh ngày 08/09/2026 với Node 24: 11/11 kiểm thử logic đạt, gồm hợp đồng Structured Outputs; bộ kiểm thử tích hợp đạt; build production Webpack và kiểm tra TypeScript đạt. Migration PostgreSQL đã đồng bộ.

Chưa thực hiện kiểm thử tương tác bằng trình duyệt trong phiên xây dựng này. Micro, voice recognition, TTS, OAuth, email và AI cần được kiểm tra trên trình duyệt và tài khoản dịch vụ thực trước khi phát hành.

## Cấu hình dịch vụ

Sao chép các khóa cần thiết từ `.env.example`; không đưa secret vào frontend hoặc Git.

- **Google/Facebook:** client ID và secret. Callback: `/api/auth/callback/google` hoặc `/api/auth/callback/facebook`. Nút đăng nhập chỉ xuất hiện khi cấu hình đủ.
- **AI:** mặc định dùng Groq Free. Điền `GROQ_API_KEY`, giữ `AI_PROVIDER=groq` và tùy chọn `AI_MODEL` (mặc định `openai/gpt-oss-120b`) trong `.env`, sau đó khởi động lại `pnpm dev`. Request chỉ chạy phía server qua Responses API; hội thoại, bài viết và gợi ý đều dùng JSON Schema strict rồi kiểm tra lại bằng Zod trước khi lưu. Có thể chuyển lại OpenAI bằng `AI_PROVIDER=openai`, `OPENAI_API_KEY` và `AI_MODEL=gpt-4.1-mini`.
- Gói Free có 20 lượt chat, 5 lượt chấm Writing và 3 lượt tạo lộ trình trong cửa sổ 24 giờ. Premium không có hạn mức sản phẩm theo ngày; mọi gói vẫn có giới hạn ngắn hạn để ngăn gửi lặp ngoài ý muốn. Lịch sử được lưu trong PostgreSQL của dự án; nội dung gửi để phân tích được truyền tới nhà cung cấp AI đã cấu hình.
- **Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Token reset được băm SHA-256, hết hạn sau 30 phút, chỉ dùng một lần; đổi mật khẩu làm mất hiệu lực session cũ.
- **Proxy:** chỉ bật `TRUST_PROXY=true` khi reverse proxy do bạn quản lý **ghi đè** `X-Real-IP`. Khi đó có thêm giới hạn theo IP ngoài giới hạn tài khoản và ngưỡng bảo vệ tổng. Môi trường công khai nên có rate limiting tại proxy.

Tạo quản trị viên cho môi trường riêng bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` và `pnpm admin:create`. Mật khẩu không được ghi ra terminal.

## Luyện đề TOEIC / IELTS

Mục **Luyện đề TOEIC / IELTS** tại `/exams` có 6 bộ đề rút gọn, 72 câu do EnglishMaster biên soạn, ở ba mức cơ bản / trung cấp / nâng cao. TOEIC mẫu có hoàn thành câu, đọc và nghe tổng hợp bằng giọng trình duyệt; IELTS mẫu tập trung Academic Reading với trắc nghiệm, True/False/Not Given và trả lời ngắn có giới hạn số từ. Kết quả là số câu đúng và phần trăm chính xác; không chuyển đổi tuyến tính thành điểm TOEIC hoặc band IELTS chính thức.

Sau khi cập nhật code, dừng dev server nếu Prisma engine đang bị khóa trên Windows rồi chạy:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed:exams
pnpm dev
```

`ExamPaper` lưu đề; `ExamAttempt` lưu bài làm, đáp án, thời điểm bắt đầu/hết hạn/nộp bài và bản sao nội dung đề. Chế độ ôn tập đếm thời gian trôi qua từ khi bắt đầu, gồm cả thời gian rời trang; chế độ kiểm tra dùng hạn nộp do server đặt. Tải lại trang hoặc đổi đồng hồ máy không reset thời hạn server. Đáp án tự lưu khi thay đổi; bản nháp chưa gửi còn được giữ trên thiết bị để gửi lại sau khi có kết nối, nếu bài chưa hết hạn. Khi hết hạn, UI khóa và tự gửi yêu cầu nộp. Nếu trình duyệt đã đóng hoặc mất mạng, bài vẫn hết hạn theo server; lần truy cập tiếp theo sẽ chốt kết quả từ đáp án đã lưu tại thời hạn, không nhận đáp án gửi muộn. Không cần cron cho từng bài.

Chấm điểm và giải thích chỉ được trả sau khi nộp. Gửi lại yêu cầu nộp không tạo thêm bài hoặc thay đổi điểm. Đề chỉnh sửa sau đó không làm thay đổi lịch sử đã lưu. Có thể bổ sung đề trong `prisma/exam-content.ts`; `pnpm db:seed:exams` chỉ đồng bộ bộ đề. Quy trình đồng bộ nội dung Vercel production hiện có cũng seed các bộ đề này qua `prisma/seed.ts`.

Kiểm tra: `pnpm typecheck`, `pnpm test`. Sau khi migrate/seed, chạy `pnpm test:exams:integration` để kiểm tra với PostgreSQL local thật; script tạo một tài khoản tạm, kiểm tra lưu/tiếp tục bài, bắt đầu đồng thời, tự nộp quá hạn, chặn đáp án muộn và lịch sử, rồi xóa đúng tài khoản tạm cùng bài làm thử. Script từ chối database không ở localhost.

Khi `pnpm dev` đang chạy ở `http://localhost:3000`, chạy thêm `pnpm test:exams:http` để kiểm tra route HTTP thật (bao gồm export `PUT`), lưu/đọc lại đáp án và nộp bài có chấm điểm/giải thích. Script dùng phiên đăng nhập của tài khoản test tạm riêng, không dùng tài khoản học viên; chỉ chấp nhận máy chủ và database local, rồi xóa dữ liệu test. Có thể đặt `EXAM_TEST_BASE_URL` nếu dev server chạy ở cổng local khác.

## Premium bằng chuyển khoản QR (đối soát thủ công)

Migration `20261016010000_bank_transfer_premium` bổ sung cấu hình ngân hàng và mở rộng bảng `Payment` cho đơn chuyển khoản. Migration `20261019000000_generated_vietqr` bổ sung mã ngân hàng và URL QR tự sinh theo từng đơn, không xóa ảnh/đơn cũ. Chạy `pnpm db:migrate`, `pnpm db:generate`, rồi khởi động lại `pnpm dev` (dừng server trước khi generate nếu Windows đang khóa DLL). Migration không tự bật thu tiền hoặc tạo tài khoản nhận tiền mẫu.

1. Admin vào **Gói thành viên** (`/admin/subscriptions`), nhập tên ngân hàng, mã ngân hàng/BIN VietQR (VD: `970415` hoặc `ICB` cho Vietinbank), tên chủ tài khoản và số tài khoản. Điền đủ thông tin sẽ tự hiện QR xem trước tài khoản nhận, không cần upload ảnh. Nhập giá 1 tháng/12 tháng và thông tin hỗ trợ, bật đăng ký rồi lưu. Mã ngân hàng là BIN hoặc mã viết tắt VietQR, không phải tên chi nhánh. QR xem trước chưa có số tiền/mã đơn và chưa áp dụng cho học viên cho đến khi lưu. Luôn quét thử để kiểm tra tài khoản thực; hệ thống không tự tra cứu/xác thực chủ tài khoản ngân hàng.
2. Học viên vào **Gói học & thanh toán** (`/billing`) hoặc từ `/pricing`, tạo đơn. Server chốt giá, tài khoản, mã ngân hàng, mã đơn `EM…` rồi tạo URL VietQR có `amount`, `addInfo` và `accountName`; client không được quyết định số tiền hoặc URL. QR được điền sẵn số tiền và mã đơn, học viên vẫn phải kiểm tra trên ứng dụng ngân hàng trước khi xác nhận. Mỗi người chỉ có một đơn đang mở. Giá, ngân hàng và URL QR được chụp lại theo đơn; sửa cấu hình không đổi đơn cũ. Đơn tạo trước khi chuyển sang VietQR vẫn dùng đúng ảnh QR cũ, không tự thay tài khoản nhận bằng cấu hình mới.
3. Sau khi chuyển khoản, học viên có thể tải biên lai và bấm **Tôi đã chuyển khoản**. Admin nhận thông báo trong hệ thống, đơn sang chờ đối soát; **chưa mở Premium**. Không gửi OTP, mật khẩu hoặc thông tin thẻ. Biên lai chỉ người sở hữu và admin được xem.
4. Admin kiểm tra giao dịch thực nhận trên ngân hàng, đối chiếu số tiền và mã đơn; nhập mã giao dịch ngân hàng và xác nhận đã nhận đủ tiền, sau đó duyệt. Một transaction cập nhật `Payment`, `Subscription`, vai trò và thông báo cho học viên. Gửi lại cùng thao tác không cộng thời hạn lần nữa; mã ngân hàng không thể dùng cho hai đơn. Nên nhập mã giao dịch theo cùng quy ước (bao gồm ngân hàng nếu cần) để đối soát nhất quán.
5. Gói mới bắt đầu khi được duyệt; gia hạn cộng 1 hoặc 12 tháng lịch từ ngày hết hạn còn hiệu lực. Gói đã hết hạn bắt đầu lại từ lúc duyệt; gói cấp trọn đời không bị rút ngắn. Các chức năng Premium kiểm tra `Subscription.currentPeriodEnd`, không chỉ vai trò `PREMIUM`. Học viên thấy trạng thái và thông báo khi mở gói; không tự gia hạn / tự trừ tiền. Đơn bị từ chối có lý do và được gửi yêu cầu đối soát lại; không chuyển tiền lại chỉ vì bị từ chối.

QR mới dùng Quick Link `https://img.vietqr.io/image/<BANK_CODE>-<ACCOUNT_NO>-compact.svg` tương tự logic tham khảo từ `luxhomes_server/src/models/payment.model.js`, không gọi API Generate và không cần upload ảnh. Dùng SVG theo khuyến nghị hiện tại của [VietQR](https://www.vietqr.io/qr-dong) và [thông báo chuyển đổi](https://www.vietqr.io/thong-bao-cap-nhat). Khi hiển thị ảnh, trình duyệt gửi mã ngân hàng, số tài khoản, tên người nhận, cùng số tiền và mã đơn (đối với QR đơn) tới VietQR; không gửi email học viên, mật khẩu, OTP hoặc ảnh biên lai. QR xem trước được cập nhật sau khi nhập ổn định để tránh gửi request mỗi phím bấm. Nếu dịch vụ tạo ảnh lỗi, UI báo rõ và vẫn có thông tin để đối chiếu/chuyển khoản thủ công; không coi việc tải được ảnh là đã thanh toán hoặc xác thực chủ tài khoản.

Chỉ biên lai và ảnh QR của các đơn cũ còn lưu trong `PaymentImage` (PostgreSQL), không ghi vào filesystem tạm của Vercel. Ảnh cũ được giữ để lịch sử không bị đổi. Cần theo dõi dung lượng database và chuyển biên lai sang object storage khi tăng quy mô. Thông tin ngân hàng/giá/đơn tiền là dữ liệu vận hành, không nằm trong seed và không bị seed ghi đè. Cấu hình thông tin nhận tiền riêng trên production sau khi deploy; dữ liệu local không tự đồng bộ lên Vercel. Cấu hình cũ cần bổ sung mã ngân hàng/BIN rồi lưu trước khi tạo đơn mới.

Chưa kết nối API ngân hàng/webhook nên hệ thống **không tự biết tiền đã vào**. Admin cần kiểm tra ngân hàng thủ công; email/ảnh chụp/nút báo đã chuyển không phải bằng chứng đối soát tự động. Hoàn tiền, tự động đối soát, hóa đơn và cơ chế thu tiền định kỳ chưa nằm trong tính năng này.

Kiểm thử: `pnpm test`, `pnpm typecheck`; khi dev server và PostgreSQL local đang chạy, `pnpm test:billing:http`. Unit test kiểm tra URL VietQR, encoding, số tiền/mã đơn do server quyết định, bảo vệ giá trị đầu vào và việc lưu snapshot. HTTP test dùng tài khoản/đơn tạm, kiểm tra quyền, QR cũ, URL QR mới, ảnh biên lai riêng tư, upload biên lai giả, xác nhận giao dịch, duyệt lặp/đồng thời, gia hạn và từ chối/hủy; dọn đúng dữ liệu test. Không dùng phiên học viên thật, không đổi cấu hình ngân hàng/giá thật và từ chối chạy vào host/database không phải local. Các integration test không gửi request tới VietQR với thông tin tài khoản thật.

## Học tiếng Anh và tiếng Trung

Ở thanh trên cùng của khu học tập, chọn **Tiếng Anh / Tiếng Trung**. Hệ thống lưu lựa chọn vào `Profile.targetLanguage` (`en` / `zh`), đăng ký khóa nhập môn khả dụng nếu chưa có, rồi mở bài chưa hoàn thành gần nhất của ngôn ngữ đó. Chuyển lại sẽ tiếp tục đúng bài/bước cũ; không xóa tiến độ, flashcard hoặc bài viết của ngôn ngữ còn lại. `Profile.language` vẫn là tùy chọn ngôn ngữ giao diện, không phải ngôn ngữ học.

Khóa học/bản đồ, từ vựng, flashcard, ngữ pháp, nghe, nói, đọc, viết, bài luyện tập, tìm kiếm và hội thoại AI được lọc theo ngôn ngữ học. Tiến độ bài, từ đang học, lịch ôn và điểm kỹ năng được xem riêng theo ngôn ngữ; XP, chuỗi ngày, thời gian học, mục tiêu ngày và gói Premium dùng chung tài khoản. Kiểm tra CEFR, điều chỉnh lộ trình tiếng Anh và bộ đề TOEIC/IELTS vẫn là nội dung **tiếng Anh**, có thông báo rõ khi truy cập từ chế độ tiếng Trung.

Bộ tiếng Trung ban đầu dùng **chữ giản thể + Pinyin + nghĩa tiếng Việt**: 6 bài, 24 từ biên soạn riêng, 6 bài nghe/đọc/nói/viết, 24 câu hỏi và 4 bộ luyện tập kỹ năng. Thư viện bổ sung thêm **3.000 từ** có nghĩa Việt, Pinyin và câu ví dụ tiếng Trung (tổng 3.024 từ khi nhập mới), chia chủ đề theo nhãn HSK 3.0/2021 của nguồn cộng đồng. Đây không phải giáo trình đầy đủ hoặc khóa luyện thi HSK chính thức. Quản trị viên có thể chọn `language` khi tạo/sửa nội dung và nhập Pinyin; nội dung gắn vào bài học phải cùng ngôn ngữ với khóa học. Từ vựng vẫn giữ ràng buộc `word` duy nhất toàn hệ thống để tương thích các bộ nhập hiện tại; nếu mở rộng các ngôn ngữ có cách viết trùng nhau, cần nâng cấp khóa này và các script nhập dữ liệu.

Lần đầu cập nhật trên máy local:

```powershell
# Dừng pnpm dev trước db:generate nếu Windows đang khóa Prisma DLL.
pnpm db:migrate
pnpm db:generate
pnpm db:seed:chinese
pnpm dev
```

Lệnh seed tiếng Trung có thể chạy lại, không tạo tài khoản demo hoặc xóa dữ liệu học viên. Gói 3.000 từ dùng insert-only/skip-duplicates, không ghi đè nghĩa hoặc bản dịch câu đã được chỉnh sửa. `pnpm db:seed` và luồng Vercel Production hiện có cũng đồng bộ bộ nội dung này sau migration; không cần copy tài khoản/progress từ local lên production. Dữ liệu đã được commit trong `prisma/data/chinese-vocabulary-3000.json`, deploy không cần tải nguồn ngoài hoặc gọi AI. Muốn tái tạo artifact từ các phiên bản nguồn cố định, chạy `pnpm vocabulary:build:chinese` (chỉ tạo file, không nhập DB).

Nút **Nghe câu ví dụ** có ở thẻ từ vựng, từ điển, chi tiết từ trong bài đọc và mặt sau flashcard của cả tiếng Anh lẫn tiếng Trung, tách khỏi nút nghe từ đơn. Có chọn giọng và tốc độ; dùng TTS trình duyệt, không phải bản thu người thật và không gọi AI để phát âm. Giọng đọc/nhận dạng đặt locale `zh-CN` cho chữ Hán; giọng khả dụng phụ thuộc trình duyệt/hệ điều hành. Chấm nói là độ khớp lời nhận dạng, không phải điểm thanh điệu/phát âm. Chấm viết, hội thoại và tra từ tự động ngoài thư viện cần dịch vụ AI đã cấu hình, dùng chung hạn mức tài khoản.

**Kiểm tra phát âm từ / câu ví dụ** mở hộp thoại nghe mẫu → chủ động cho phép micro → đọc → dừng và đối chiếu. Dùng Web Speech Recognition (`en-US` / `zh-CN`) cùng MediaRecorder, không cần thêm API key hay migration. Chỉ tính độ khớp bản nhận dạng cuối, nêu từ/chữ còn thiếu hoặc khác mẫu; không giả lập điểm âm vị, ngữ điệu hoặc thanh điệu. Khớp 100% vẫn không chứng nhận phát âm chuẩn. Bản thu nghe lại chỉ giữ bằng Blob URL trong lần mở hộp thoại; ứng dụng không tải âm thanh hoặc transcript lên server, không đổi XP/lịch ôn. Tuy nhiên dịch vụ nhận dạng của trình duyệt có thể gửi âm thanh tới máy chủ của họ và cần mạng; UI thông báo trước khi bắt đầu. Thu tối đa 45 giây; đóng hộp thoại/đổi nội dung dừng micro và hủy nhận dạng, kể cả khi quyền micro được cấp muộn. Không hỗ trợ nhận dạng thì chỉ thu và nghe lại; lỗi quyền/mạng hoặc không có lời nhận dạng cuối không được coi là điểm phát âm 0.

Gói 3.000 từ ghép danh sách/Pinyin từ Complete HSK Vocabulary, nghĩa Việt từ CVDICT qua bản lưu thaoshibe và câu ví dụ từ hsk-sentences-audio. Chỉ nhận mục khớp Pinyin **cả thanh điệu**, có câu ví dụ chứa đúng token từ; dữ liệu cộng đồng vẫn có thể còn lỗi và chưa được hiệu đính thủ công toàn bộ. Câu mới chưa có sẵn bản dịch Việt: UI dùng luồng dịch AI khi mở thẻ nếu đã cấu hình, rồi lưu kết quả để lần sau không dịch lại. Không tự dịch hàng loạt hoặc lấy nghĩa từ ghép giả thành bản dịch câu. Xem `ATTRIBUTION.md` và `/data/chinese-vocabulary-attribution.json` để biết nguồn, phiên bản cố định và giấy phép CC BY-SA 4.0.

Các nút **Xem Bính âm / Cách viết chữ Hán / Luyện viết nét** có cho cả từ vựng và câu ví dụ tiếng Trung ở thẻ từ, flashcard, từ điển và chi tiết từ trong bài đọc. Công cụ của từ ở ngoài nút lật flashcard; công cụ câu ví dụ xuất hiện sau khi lật. Bính âm ưu tiên bản lưu của từ; câu chưa có bản lưu dùng `pinyin-pro@3.29.5` chạy cục bộ, giữ thanh gốc, không gọi AI/API dịch và không tự lưu đè vào DB. Cách đọc tự động theo ngữ cảnh có thể còn sai với tên riêng/từ đa âm; không thay thế bài học thanh điệu.

Trong hộp thoại, chọn từng chữ rồi **Viết mẫu / Nét trước / Nét tiếp** hoặc chuyển **Tự viết**. Hanzi Writer `3.7.3` nhận chuột/bút/chạm, đối chiếu hình nét, thứ tự và hướng đi; viết sai được thử lại, hai lần sai có gợi ý. Không tự tính đúng sau nhiều lần sai. Có **Gợi ý nét tiếp / Viết lại / Chữ tiếp**, số nét khớp và số lần thử sai; kết quả và các chữ đã viết xong chỉ giữ trong lần mở hiện tại, không phải điểm thư pháp/chứng chỉ. Câu ví dụ được tách từng chữ theo thứ tự, giữ các chữ lặp, bỏ dấu câu khỏi phần luyện viết. Không đổi tiến độ, lịch ôn hay XP; phím tắt chấm flashcard tạm ngừng trong hộp thoại và không chiếm phím của các nút công cụ. Đóng hoặc đổi chữ dừng phiên viết và dọn pointer listeners. Hoạt động trên desktop/mobile và tôn trọng cài đặt giảm chuyển động.

Dữ liệu nét chữ được tải trực tiếp từ jsDelivr, gói `hanzi-writer-data@2.0.1`, chỉ khi mở và chỉ cho chữ đang chọn; không cần API key, không gọi AI hoặc sửa schema/seed. Tải lần đầu cần Internet; cache trong phiên trình duyệt tối đa 100 chữ. Không gửi cookie hoặc referrer đến CDN; CDN nhận địa chỉ IP của trình duyệt như các tài nguyên ngoài khác. Chữ thiếu dữ liệu/mất mạng có thông báo và nút thử lại, không dựng nét giả. Nguồn và giấy phép Arphic được dẫn ngay trong hộp thoại và `ATTRIBUTION.md`.

Kiểm thử: `pnpm test`, `pnpm typecheck`, `pnpm test:languages:http` (cần server + DB localhost đang chạy). Có thể đặt `LANGUAGES_TEST_BASE_URL=http://localhost:3101` để chạy với server kiểm thử riêng. HTTP test chỉ tạo/xóa đúng tài khoản tạm, không gọi AI trả phí hoặc thay đổi người học thật; kiểm tra chọn ngôn ngữ, thư viện/flashcard/hội thoại riêng, tiếp tục bài và giữ nguyên CEFR tiếng Anh.

## Triển khai

```powershell
pnpm build
pnpm start
```

Hoặc dùng Dockerfile đi kèm và PostgreSQL được quản lý riêng. Cung cấp `DATABASE_URL`, `NEXTAUTH_URL` và `NEXTAUTH_SECRET` ở runtime; chạy `prisma migrate deploy` trước khi phục vụ người dùng. Thư mục `public/uploads` cần volume bền vững khi chạy một instance. Chuyển upload sang object storage trước khi chạy nhiều instance.

Trên Vercel, kết nối repository Git và chọn đúng **Production Branch** trong Project Settings. Chỉ khi commit được **push** lên nhánh đó, Vercel mới tự chạy build/deploy production; commit trên máy chưa kích hoạt Vercel. `vercel.json` dùng `pnpm run vercel-build`: tạo Prisma Client, chạy migration còn thiếu, cập nhật nội dung học từ `prisma/seed.ts` (không tạo tài khoản demo), nhập các từ còn thiếu từ `prisma/seed-vocabulary-5000.sql` và gói bổ sung `prisma/seed-vocabulary-additional-3000.sql`, rồi build ứng dụng. Hai tệp SQL chỉ chèn từ chưa tồn tại (`ON CONFLICT ("word") DO NOTHING`), không sửa tiến độ học. Gói bổ sung được nguồn Openjam gắn nhãn C2; đây là nhãn của nguồn, chưa được hiệu đính thủ công từng từ. Nếu bước nào lỗi, build dừng. Bước đồng bộ cơ sở dữ liệu chỉ chạy khi `VERCEL_ENV=production`; Preview không ghi vào database. Nguồn và giấy phép dữ liệu từ vựng ở `ATTRIBUTION.md`.

Trong Vercel, đặt `DATABASE_URL` trỏ đến PostgreSQL production ở phạm vi **Production**, cùng `NEXTAUTH_SECRET`, `AI_PROVIDER=groq`, `GROQ_API_KEY` và `AI_MODEL=openai/gpt-oss-120b`. `NEXTAUTH_URL` có thể là domain production đầy đủ; nếu bỏ trống, build tự dùng `VERCEL_URL` của deployment. Không tạo biến Vercel với giá trị rỗng cho secret bắt buộc. Nếu dùng Preview, hãy dùng database Preview riêng và triển khai migration cho nó trước khi thử tính năng mới; không dùng chung `DATABASE_URL` production. Không đặt `DEMO_PASSWORD` trên production.

Đây là đồng bộ **cấu trúc và nội dung học được lưu trong Git**, không sao chép toàn bộ database cục bộ lên production. Tài khoản, tiến độ, flashcard và bài làm của người dùng trên production được giữ lại. Migration production nên tương thích ngược với phiên bản đang chạy, vì database được cập nhật trước khi bản deploy mới hoạt động. Sao lưu database trước khi triển khai migration có thể thay đổi dữ liệu hiện có.

Nếu database production đã có bảng được tạo thủ công hoặc bằng `prisma db push` mà chưa có lịch sử `_prisma_migrations`, cần baseline migration trước khi bật tự động triển khai; không chạy migration khởi tạo đè lên các bảng đang có.

Các thiết lập trong repository không tự kết nối dự án với Vercel hoặc tạo PostgreSQL; cần hoàn tất các bước đó trong tài khoản Vercel trước lần deploy đầu tiên.

## Phạm vi MVP và phần cần hoàn thiện trước khi mở thương mại

- Premium hỗ trợ chuyển khoản QR và admin đối soát/mở gói thủ công. Chưa nối API ngân hàng/cổng thanh toán/webhook, chưa tự đối soát, hoàn tiền hoặc xuất hóa đơn.
- Speaking chấm **độ khớp văn bản nhận dạng**, không giả lập điểm phát âm, độ trôi chảy hoặc ngữ điệu. Muốn chấm các chỉ số đó cần dịch vụ phân tích âm thanh.
- UI hiện bằng tiếng Việt. Nội dung học tiếng Anh có bản dịch; chưa có bản dịch toàn bộ giao diện sang tiếng Anh.
- Luyện đề TOEIC/IELTS hiện là các bộ đề rút gọn, chưa phải đề thi đủ độ dài hoặc đủ bốn kỹ năng. Chấm tự động câu chọn đáp án và trả lời ngắn; chưa chấm Writing/Speaking theo thang điểm chứng chỉ trong khu luyện đề.
- Gợi ý học hiện dựa trên điểm kỹ năng đã lưu; chưa dùng mô hình AI để tối ưu lộ trình. CEFR là ước tính tham khảo, không phải chứng chỉ.
- Từ điển dùng thư viện nội bộ đã seed; không tra mọi từ bên ngoài. History tra từ và theme chỉ là tùy chọn trên thiết bị.
- Nhắc học là thông báo trong ứng dụng, chưa có push/email chạy nền. Bài viết AI được lưu nhưng chưa có màn hình lịch sử bài viết riêng.
- Các khóa và nội dung là bộ khởi đầu, chưa phải giáo trình đầy đủ mọi trình độ. Chưa kiểm thử tải, vận hành nhiều instance, email/OAuth/AI thật hoặc thanh toán.

Tài liệu tham chiếu: [NextAuth](https://next-auth.js.org/configuration/options), [Groq Responses API](https://console.groq.com/docs/responses-api), [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs).
