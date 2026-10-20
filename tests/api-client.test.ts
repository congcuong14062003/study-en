import assert from "node:assert/strict";
import test from "node:test";
import { api } from "../src/lib/utils";

test("API client reads JSON and preserves the request method and body", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(url, "/api/exam-attempts/test/answers");
    assert.equal(options?.method, "PUT");
    assert.equal(options?.body, '{"answers":{"q1":"0"}}');
    return Response.json({ answers: { q1: "0" } });
  });
  assert.deepEqual(await api("/exam-attempts/test/answers", {
    method: "PUT", body: '{"answers":{"q1":"0"}}',
  }), { answers: { q1: "0" } });
});

test("API client reports HTTP status for an empty 405 instead of a JSON parsing error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 405 }));
  await assert.rejects(() => api("/exam-attempts/test/answers"), /HTTP 405/);
});

test("API client does not expose HTML from gateway errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Bad gateway</html>", { status: 502 }));
  await assert.rejects(() => api("/exams"), /HTTP 502/);
});

test("API client preserves JSON API error messages", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Không tìm thấy bài làm." }, { status: 404 }));
  await assert.rejects(() => api("/exam-attempts/test"), /Không tìm thấy bài làm/);
});

test("API client handles no-content responses but rejects malformed successful JSON", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 204 }));
  assert.equal(await api("/test"), undefined);
  fetchMock.mock.mockImplementation(async () => new Response("not JSON"));
  await assert.rejects(() => api("/test"), /dữ liệu không hợp lệ/);
});
