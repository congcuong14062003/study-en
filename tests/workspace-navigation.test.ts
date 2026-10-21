import test from "node:test";
import assert from "node:assert/strict";
import { mainLinks, learningLinks, personalLinks, communityLinks, adminLinks, mobileTabs, mobileTabForPath, navigationIsActive, workspacePageTitle } from "../src/lib/workspace-navigation";

test("shared mobile/desktop navigation contains all learning and personal routes without duplicates", () => {
  const links = [...mainLinks, ...learningLinks, ...communityLinks, ...personalLinks];
  const hrefs = links.map((link) => link.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const href of ["/study-plan", "/courses", "/vocabulary", "/flashcards", "/dictionary", "/grammar", "/listening", "/speaking", "/reading", "/writing", "/exams", "/ai-tutor", "/profile", "/billing", "/settings", "/achievements", "/notifications"]) assert.ok(hrefs.includes(href), href);
  assert.ok(!hrefs.includes("/lessons"), "Do not link to a lesson route without its ID");
  assert.equal(mobileTabs.length, 4, "Four quick routes plus the complete Menu button fit mobile widths");
});
test("nested lessons, practice and exam routes select the correct mobile group", () => {
  for (const path of ["/courses", "/courses/chinese-starter", "/lessons/zh-greetings-lesson", "/study-plan"]) assert.equal(mobileTabForPath(path), "/study-plan");
  for (const path of ["/flashcards", "/dictionary", "/reading/article-id", "/speaking", "/quiz", "/vocabulary"]) assert.equal(mobileTabForPath(path), "/vocabulary");
  for (const path of ["/profile", "/exams/attempt-id", "/admin/users", "/settings"]) assert.equal(mobileTabForPath(path), "menu");
  assert.equal(mobileTabForPath("/ai-tutor"), "/ai-tutor");
});
test("navigation titles and current-page markers handle nested routes and admin root correctly", () => {
  assert.equal(workspacePageTitle("/lessons/zh-greetings-lesson"), "Bài học");
  assert.equal(workspacePageTitle("/admin/subscriptions"), "Gói thành viên");
  assert.equal(workspacePageTitle("/reading/article-id"), "Luyện đọc");
  assert.equal(navigationIsActive("/admin", "/admin/users"), false);
  assert.equal(navigationIsActive("/reading", "/reading-extra"), false);
  assert.equal(new Set(adminLinks.map((link) => link.href)).size, adminLinks.length);
});
