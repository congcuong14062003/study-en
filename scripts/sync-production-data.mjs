import { spawnSync } from "node:child_process";
import { join } from "node:path";

const production = process.env.VERCEL_ENV === "production";
const dryRun = process.argv.includes("--dry-run");

if (!production) {
  console.log("Skipping database synchronization outside Vercel Production.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for Vercel Production database synchronization.");
  process.exit(1);
}

const prismaCli = join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const steps = [
  ["Apply pending migrations", prismaCli, ["migrate", "deploy"]],
  ["Sync shared learning content", tsxCli, ["prisma/seed.ts", "--content-only"]],
  ["Import missing vocabulary", prismaCli, ["db", "execute", "--schema", "prisma/schema.prisma", "--file", "prisma/seed-vocabulary-5000.sql"]],
  ["Import 3,000 additional vocabulary entries", prismaCli, ["db", "execute", "--schema", "prisma/schema.prisma", "--file", "prisma/seed-vocabulary-additional-3000.sql"]],
];

for (const [label, cli, args] of steps) {
  console.log(`${dryRun ? "Would run" : "Running"}: ${label}`);
  if (dryRun) continue;
  const result = spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
