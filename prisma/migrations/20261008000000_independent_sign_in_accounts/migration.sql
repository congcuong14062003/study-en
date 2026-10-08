-- Email identifies a mailbox, not a User: password, Google and Facebook
-- accounts can each own independent learning data under the same address.
BEGIN;

DROP INDEX "User_email_key";
CREATE INDEX "User_email_idx" ON "User" ("email");

-- Only one password account may use an email. OAuth accounts have no password.
CREATE UNIQUE INDEX "User_password_email_key"
  ON "User" ("email") WHERE "passwordHash" IS NOT NULL;

-- Old reset links could target an OAuth-only User because the previous
-- endpoint looked up email alone. They must not turn OAuth into a password user.
DELETE FROM "PasswordReset" r
  USING "User" u
  WHERE r."userId" = u."id" AND u."passwordHash" IS NULL;

-- Keep all existing learning data on the password User. Move each OAuth
-- identity to a fresh free User. For an OAuth-only User with multiple
-- identities, the oldest Account keeps the existing learning data.
DO $$
DECLARE
  entry RECORD;
  new_user_id TEXT;
BEGIN
  FOR entry IN
    SELECT a."id" AS account_id, a."userId" AS old_user_id,
           u."name", u."email", u."image", u."banned",
           (u."passwordHash" IS NOT NULL) AS has_password,
           ROW_NUMBER() OVER (PARTITION BY a."userId" ORDER BY a."id") AS account_rank
    FROM "Account" a
    JOIN "User" u ON u."id" = a."userId"
    WHERE a."provider" IN ('google', 'facebook')
    ORDER BY a."userId", a."id"
  LOOP
    IF entry.has_password OR entry.account_rank > 1 THEN
      new_user_id := 'oauth-' || entry.account_id;
      INSERT INTO "User" (
        "id", "name", "email", "emailVerified", "emailVerificationRequired",
        "image", "passwordHash", "role", "banned", "sessionVersion", "updatedAt"
      ) VALUES (
        new_user_id, entry."name", entry."email", NULL, false,
        entry."image", NULL, 'USER', entry."banned", 0, CURRENT_TIMESTAMP
      );

      INSERT INTO "Profile" ("id", "userId")
        VALUES ('profile-' || entry.account_id, new_user_id);
      INSERT INTO "UserProgress" ("id", "userId")
        VALUES ('progress-' || entry.account_id, new_user_id);
      INSERT INTO "Subscription" ("id", "userId")
        VALUES ('subscription-' || entry.account_id, new_user_id);

      UPDATE "Account" SET "userId" = new_user_id
        WHERE "id" = entry.account_id;
      -- Old JWT sessions must not retain access through a moved provider.
      UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1
        WHERE "id" = entry.old_user_id;
    END IF;
  END LOOP;
END $$;

COMMIT;
