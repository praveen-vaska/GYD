/**
 * Shared MongoDB Atlas seeding & index initialization helper.
 * Used both by CLI (`npm run seed:mongodb`) and first-boot auto-seed (`ensureSeeded`).
 */
import type { Db } from "mongodb";
import {
  SEED_ADDRESSES,
  SEED_AUDIT_LOGS,
  SEED_AVAILABILITY,
  SEED_BOOKINGS,
  SEED_CATEGORIES,
  SEED_CMS,
  SEED_COMMISSIONS,
  SEED_CONVERSATIONS,
  SEED_COUPONS,
  SEED_CUSTOMERS,
  SEED_DESIGNERS,
  SEED_FAVOURITES,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_PAYMENTS,
  SEED_PAYOUTS,
  SEED_PLATFORM_SETTINGS,
  SEED_PORTFOLIOS,
  SEED_REFUNDS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_USERS,
  SEED_VERIFICATIONS,
} from "@/services/mock/seed-data";
import { getEntityKeyField, type EntityCollectionName } from "./collections";

interface SeedCollectionEntry {
  name: EntityCollectionName;
  docs: unknown[];
}

function getSeedEntries(): SeedCollectionEntry[] {
  return [
    { name: "users", docs: SEED_USERS },
    { name: "customers", docs: SEED_CUSTOMERS },
    { name: "addresses", docs: SEED_ADDRESSES },
    { name: "categories", docs: SEED_CATEGORIES },
    { name: "designers", docs: SEED_DESIGNERS },
    { name: "services", docs: SEED_SERVICES },
    { name: "portfolios", docs: SEED_PORTFOLIOS },
    { name: "availability", docs: SEED_AVAILABILITY },
    { name: "verifications", docs: SEED_VERIFICATIONS },
    { name: "bookings", docs: SEED_BOOKINGS },
    { name: "payments", docs: SEED_PAYMENTS },
    { name: "refunds", docs: SEED_REFUNDS },
    { name: "commissions", docs: SEED_COMMISSIONS },
    { name: "payouts", docs: SEED_PAYOUTS },
    { name: "reviews", docs: SEED_REVIEWS },
    { name: "conversations", docs: SEED_CONVERSATIONS },
    { name: "messages", docs: SEED_MESSAGES },
    { name: "notifications", docs: SEED_NOTIFICATIONS },
    { name: "favourites", docs: SEED_FAVOURITES },
    { name: "coupons", docs: SEED_COUPONS },
    { name: "audit_logs", docs: SEED_AUDIT_LOGS },
  ];
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").createIndex({ id: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("categories").createIndex({ id: 1 }, { unique: true }),
    db.collection("categories").createIndex({ slug: 1 }, { unique: true }),
    db.collection("designers").createIndex({ id: 1 }, { unique: true }),
    db
      .collection("designers")
      .createIndex({ city: 1, approvalStatus: 1 }),
    db
      .collection("availability")
      .createIndex({ designerId: 1 }, { unique: true }),
    db.collection("bookings").createIndex({ id: 1 }, { unique: true }),
    db
      .collection("bookings")
      .createIndex({ customerId: 1, createdAt: -1 }),
    db
      .collection("bookings")
      .createIndex({ designerId: 1, createdAt: -1 }),
    db
      .collection("bookings")
      .createIndex({ idempotencyKey: 1 }, { sparse: true }),
    db.collection("platform_config").createIndex({ id: 1 }, { unique: true }),
  ]);
}

export interface SeedResult {
  seeded: boolean;
  counts: Record<string, number>;
}

/**
 * Seeds all GYD collections into MongoDB Atlas.
 * With `forceReset: false` (default), seeds only if `users` and `designers` are both empty.
 */
export async function seedDatabase(
  db: Db,
  options: { forceReset?: boolean } = {}
): Promise<SeedResult> {
  const { forceReset = false } = options;

  if (!forceReset) {
    const [userCount, designerCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("designers").countDocuments(),
    ]);
    if (userCount > 0 || designerCount > 0) {
      return { seeded: false, counts: {} };
    }
  }

  const counts: Record<string, number> = {};
  const entries = getSeedEntries();

  for (const { name, docs } of entries) {
    const col = db.collection(name);
    if (forceReset) {
      await col.deleteMany({});
    }
    if (docs.length > 0) {
      const keyField = getEntityKeyField(name);
      const ops = docs.map((doc) => {
        const record = doc as Record<string, unknown>;
        return {
          replaceOne: {
            filter: { [keyField]: record[keyField] },
            replacement: record,
            upsert: true,
          },
        };
      });
      await col.bulkWrite(ops, { ordered: false });
    }
    counts[name] = docs.length;
  }

  const now = new Date().toISOString();
  const configCol = db.collection("platform_config");
  await configCol.bulkWrite([
    {
      replaceOne: {
        filter: { id: "settings" },
        replacement: {
          id: "settings",
          value: SEED_PLATFORM_SETTINGS,
          updatedAt: now,
        },
        upsert: true,
      },
    },
    {
      replaceOne: {
        filter: { id: "cms" },
        replacement: {
          id: "cms",
          value: SEED_CMS,
          updatedAt: now,
        },
        upsert: true,
      },
    },
  ]);
  counts.platform_config = 2;

  await ensureIndexes(db);
  return { seeded: true, counts };
}

declare global {
  var _gydAutoSeedPromise: Promise<SeedResult> | undefined;
}

/**
 * Concurrency-safe auto-seed guard for API routes.
 * Initializes an empty Atlas database once on first request.
 */
export async function ensureSeeded(db: Db): Promise<void> {
  if (!global._gydAutoSeedPromise) {
    global._gydAutoSeedPromise = seedDatabase(db, { forceReset: false }).catch(
      (err) => {
        global._gydAutoSeedPromise = undefined;
        throw err;
      }
    );
  }
  await global._gydAutoSeedPromise;
}
