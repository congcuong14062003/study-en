import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import test from "node:test";

const script = join(process.cwd(), "scripts", "sync-production-data.mjs");

function dryRun(vercelEnv: string, databaseUrl?: string) {
  return spawnSync(process.execPath, [script, "--dry-run"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VERCEL_ENV: vercelEnv, DATABASE_URL: databaseUrl ?? "" },
  });
}

test("preview builds never synchronize the database", () => {
  const result = dryRun("preview", "postgresql://example.invalid/preview");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Skipping database synchronization/);
  assert.doesNotMatch(result.stdout, /migrations|content|vocabulary/i);
});

test("production requires a database URL", () => {
  const result = dryRun("production");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DATABASE_URL is required/);
});

test("production syncs migrations, shared content, then vocabulary", () => {
  const result = dryRun("production", "postgresql://example.invalid/production");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /migrations[\s\S]*shared learning content[\s\S]*vocabulary/i);
});
