# EnglishMaster

## Kiến trúc

Next.js App Router + React + TypeScript strict. Server Components tải dữ liệu công khai; Client Components chỉ xử lý tương tác. Các route `/api/*` kiểm tra Zod, session và quyền sở hữu trước khi gọi Prisma. PostgreSQL là nguồn dữ liệu chính. Auth.js/NextAuth quản lý JWT và OAuth; mật khẩu dùng bcrypt. Dữ liệu học được tính và ghi trong transaction. Múi giờ học tập: Asia/Ho_Chi_Minh.

## Cấu trúc

`src/app`: public routes, authentication, learner workspace, admin, API. `src/components`: ui, layout, dashboard, course, learning, account. `src/lib`: db, auth, validation, API security. `src/services`: learning, spaced repetition, AI. `src/types`: typed contracts. `prisma`: schema, migrations, seed. `scripts`: local database, integration checks. `tests`: core learning invariants.

## Routes

Public: `/`, `/courses`, `/courses/[id]`, `/pricing`, `/blog`, `/blog/[id]`, `/login`, `/register`, `/forgot-password`, `/reset-password`.

Learner: `/onboarding`, `/placement-test`, `/dashboard`, `/lessons/[id]`, `/vocabulary`, `/flashcards`, `/quiz`, `/grammar`, `/grammar/[id]`, `/listening`, `/listening/[id]`, `/speaking`, `/reading`, `/reading/[id]`, `/writing`, `/ai-tutor`, `/dictionary`, `/favorites`, `/notes`, `/calendar`, `/achievements`, `/leaderboard`, `/study-plan`, `/analytics`, `/notifications`, `/profile`, `/settings`.

Admin: `/admin`, `/admin/users`, `/admin/courses`, `/admin/lessons`, `/admin/vocabulary`, `/admin/grammar`, `/admin/listening`, `/admin/reading`, `/admin/questions`, `/admin/subscriptions`, `/admin/reports`, `/admin/settings`.

Reusable components: Sidebar, MobileNav, Navbar, Footer, Button, Card, Badge, Dialog, Progress, Skeleton, CourseCard, StatCard, SkillProgress, ActivityChart, VocabularyCard, FlashCard, QuizPlayer, AudioPlayer, SpeakingRecorder, AIChat, SearchModal, EmptyState, AdminTable.

## Dữ liệu và an toàn

Models liên kết User với Profile, Account, Session, CourseEnrollment, LessonProgress, UserVocabulary, VocabularyReview, QuizAttempt/Answer, StudySession, DailyGoal, UserProgress, Favorite, Note, Notification, UserAchievement, Subscription/Payment, AIConversation/AIMessage và LearningPlan. Nội dung gồm Course/Lesson, Vocabulary, GrammarLesson, ListeningLesson, ReadingArticle, SpeakingExercise, WritingExercise, Quiz/Question, Achievement. Token đặt lại mật khẩu lưu SHA-256, một lần, có hạn. Mutation kiểm tra Origin chống CSRF. Không gửi đáp án đúng trước khi nộp quiz. Server tính XP, SRS và điểm. Admin có RBAC và kiểm tra session hiện hành.

## Dịch vụ ngoài

AI dùng API phía server khi có OPENAI_API_KEY; trạng thái chưa cấu hình được hiển thị rõ. Voice recognition/TTS tùy trình duyệt; không giả lập điểm phát âm bằng nhận dạng văn bản. Google/Facebook chỉ xuất hiện khi có cấu hình. Reset email yêu cầu SMTP. Trang Premium trình bày gói; thanh toán thực phải tích hợp nhà cung cấp và webhook trước khi mở bán.
