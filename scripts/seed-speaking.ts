import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedSpeakingSamples, speakingSamples } from "../prisma/speaking-samples";
const db = new PrismaClient();
seedSpeakingSamples(db)
  .then(() => console.log(`Synchronized ${speakingSamples.length} topic speaking samples. Learner progress preserved.`))
  .catch(() => { console.error("Speaking seed failed. Check database connectivity."); process.exitCode = 1; })
  .finally(() => db.$disconnect());
