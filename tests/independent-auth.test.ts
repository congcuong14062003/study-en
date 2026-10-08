import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAttachFirstOAuthAccount } from "../src/lib/independent-auth";

describe("independent OAuth accounts", () => {
  it("permits only the first provider on a new OAuth-only user", () => {
    assert.equal(canAttachFirstOAuthAccount(null), false);
    assert.equal(
      canAttachFirstOAuthAccount({ passwordHash: "hashed", accounts: [] }),
      false,
    );
    assert.equal(
      canAttachFirstOAuthAccount({ passwordHash: "", accounts: [] }),
      false,
    );
    assert.equal(
      canAttachFirstOAuthAccount({
        passwordHash: null,
        accounts: [{ id: "existing-google" }],
      }),
      false,
    );
    assert.equal(
      canAttachFirstOAuthAccount({ passwordHash: null, accounts: [] }),
      true,
    );
  });
});
