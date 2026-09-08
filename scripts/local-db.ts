import "dotenv/config";
import EmbeddedPostgres from "embedded-postgres";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
async function main() {
    if (!existsSync(".env")) {
        const password = randomBytes(24).toString("hex");
        writeFileSync(".env", `DATABASE_URL="postgresql://englishmaster:${password}@127.0.0.1:54329/englishmaster?schema=public"\nNEXTAUTH_URL="http://127.0.0.1:3000"\nNEXTAUTH_SECRET="${randomBytes(32).toString("hex")}"\nDEMO_PASSWORD="LearnEnglish!2026"\nOPENAI_API_KEY=""\nOPENAI_MODEL="gpt-4.1-mini"\n`, { flag: "wx" });
        process.env.DATABASE_URL = `postgresql://englishmaster:${password}@127.0.0.1:54329/englishmaster?schema=public`;
    }
    const url = new URL(process.env.DATABASE_URL!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "54329")
        throw new Error("db:local only starts the project-local PostgreSQL on port 54329. Use your configured PostgreSQL service for other URLs.");
    const directory = resolve(".local-db");
    const pg = new EmbeddedPostgres({ databaseDir: directory, user: url.username, password: url.password, port: 54329, persistent: true, authMethod: "scram-sha-256", initdbFlags: ["--encoding=UTF8", "--locale=C"], postgresFlags: ["-h", "127.0.0.1"], onLog: console.log, onError: console.error });
    if (!existsSync(resolve(directory, "PG_VERSION")))
        await pg.initialise();
    await pg.start();
    const client = pg.getPgClient("postgres", "127.0.0.1");
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ["englishmaster"]);
    if (!result.rowCount)
        await client.query('CREATE DATABASE "englishmaster"');
    await client.end();
    console.log("EnglishMaster PostgreSQL ready on 127.0.0.1:54329. Data persists in .local-db.");
    const stop = async () => {
        await pg.stop();
        process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    setInterval(() => {
    }, 60000);
}
main().catch(error => {
    console.error(error);
    process.exit(1);
});
