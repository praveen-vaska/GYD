/**
 * GYD MongoDB Atlas Seed Script
 * Run: npm run seed:mongodb
 *
 * Seeds all collections + platform configuration into MongoDB Atlas.
 * Loads MONGODB_URI from .env.local (then falls back to .env).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { getDb, getMongoClient, getMongoConfigState } from "../lib/db/mongodb";
import { seedDatabase } from "../lib/db/seed";

async function main() {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    console.error("\n❌ MongoDB Atlas is not ready to seed.");
    if (cfg.reason === "needs_password") {
      console.error(
        "   Your .env.local still has <db_password> placeholder in MONGODB_URI."
      );
    } else {
      console.error("   Set MONGODB_URI inside .env.local first.");
    }
    console.error(
      '   Example: MONGODB_URI="mongodb+srv://praveenvaska_db_user:YOUR_PASSWORD@cluster0.ir9t5u3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"'
    );
    console.error("   Then run: npm run seed:mongodb\n");
    process.exit(1);
  }

  const client = await getMongoClient();
  try {
    console.log(`✅ Connected to MongoDB Atlas (database: ${cfg.dbName})`);
    const db = await getDb();
    const res = await seedDatabase(db, { forceReset: true });

    console.log("\n📦 Seeded collections:");
    for (const [name, count] of Object.entries(res.counts)) {
      console.log(`   - ${name.padEnd(18)} ${count} document(s)`);
    }
    console.log(
      `\n🎉 Seed complete! Open MongoDB Atlas → Browse Collections → ${cfg.dbName} to verify.\n`
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
