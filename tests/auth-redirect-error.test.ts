import assert from "node:assert/strict";
import test from "node:test";
import { authRedirectErrorMessage } from "../src/lib/auth-redirect-error";

test("explains that OAuth accounts are separate", () => {
  assert.match(
    authRedirectErrorMessage("OAuthAccountNotLinked"),
    /tài khoản riêng.*đăng xuất/i,
  );
});

test("does not expose arbitrary error query parameters", () => {
  assert.equal(authRedirectErrorMessage(null), "");
  assert.doesNotMatch(authRedirectErrorMessage("<script>alert(1)</script>"), /script/);
});

test("explains access denied without claiming a single cause", () => {
  assert.match(authRedirectErrorMessage("AccessDenied"), /Nếu bạn.*chưa xác thực/i);
});
