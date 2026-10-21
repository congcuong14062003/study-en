-- Existing content/progress stays English. Profile.language remains UI language.
ALTER TABLE "Profile" ADD COLUMN "targetLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Course" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Vocabulary" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en', ADD COLUMN "pinyin" TEXT;
ALTER TABLE "GrammarLesson" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "ListeningLesson" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en', ADD COLUMN "pinyin" TEXT;
ALTER TABLE "ReadingArticle" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en', ADD COLUMN "pinyin" TEXT;
ALTER TABLE "SpeakingExercise" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en', ADD COLUMN "pinyin" TEXT;
ALTER TABLE "WritingExercise" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Question" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Quiz" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "AIConversation" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
