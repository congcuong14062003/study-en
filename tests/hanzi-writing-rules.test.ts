import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HanziWritingPractice } from "../src/components/learning/hanzi-writing-practice";

test("self-writing shows basic rules immediately and keeps additional guidance expandable", () => {
  const html = renderToStaticMarkup(createElement(HanziWritingPractice, { character: "你", onComplete: () => {} }));
  const details = html.indexOf("<details>");
  assert.ok(html.indexOf("Quy tắc viết chữ Hán") < details);
  assert.ok(html.indexOf("Trên xuống dưới:") < details);
  assert.ok(html.indexOf("Trái sang phải:") < details);
  for (const rule of ["Ngang trước, sổ sau:", "Phẩy trước, mác sau:", "đóng khung:", "Giữa trước, hai bên sau:", "Hướng bút:", "có ngoại lệ", "Gợi ý nét tiếp"]) {
    assert.ok(html.includes(rule), `Missing writing guidance: ${rule}`);
  }
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.indexOf("hanzi-writing-rules") < html.indexOf("hanzi-practice-surface"));
});
