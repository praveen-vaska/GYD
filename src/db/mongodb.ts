/**
 * MongoDB Atlas singleton client for Next.js.
 * Handles lazy configuration checks, placeholder URI detection, fast timeouts,
 * and automatic recovery if an initial connection attempt fails.
 */
import { Db, MongoClient } from "mongodb";

const PLACEHOLDER_MARKERS = [
  "<db_password>",
  "<password>",
  "cluster0.xxxxx",
  "replace-with",
];

export type MongoConfigState =
  | { configured: true; uri: string; dbName: string }
  | {
      configured: false;
      reason: "not_configured" | "needs_password" | "invalid_uri";
      dbName: string;
    };

export function getMongoDbName(): string {
  return process.env.MONGODB_DB?.trim() || "gyd_marketplace";
}

export function getMongoConfigState(): MongoConfigState {
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  const dbName = getMongoDbName();

  if (!uri) {
    return { configured: false, reason: "not_configured", dbName };
  }

  const lower = uri.toLowerCase();
  if (PLACEHOLDER_MARKERS.some((m) => lower.includes(m))) {
    return { configured: false, reason: "needs_password", dbName };
  }

  if (!lower.startsWith("mongodb://") && !lower.startsWith("mongodb+srv://")) {
    return { configured: false, reason: "invalid_uri", dbName };
  }

  return { configured: true, uri, dbName };
}

export function isMongoConfigured(): boolean {
  return getMongoConfigState().configured;
}

declare global {
  var _gydMongoClientPromise: Promise<MongoClient> | undefined;
  var _gydMongoClientUri: string | undefined;
}

export function clearCachedMongoClient(): void {
  global._gydMongoClientPromise = undefined;
  global._gydMongoClientUri = undefined;
}

/** Returns connected MongoClient; fails cleanly if MONGODB_URI is not ready. */
export async function getMongoClient(): Promise<MongoClient> {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    throw new Error(
      cfg.reason === "needs_password"
        ? "MONGODB_URI still contains the <db_password> placeholder."
        : "MONGODB_URI is not configured in .env."
    );
  }

  if (
    global._gydMongoClientPromise &&
    global._gydMongoClientUri === cfg.uri
  ) {
    return global._gydMongoClientPromise;
  }

  const client = new MongoClient(cfg.uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
  });

  const promise = client.connect().catch((err) => {
    clearCachedMongoClient();
    throw err;
  });

  global._gydMongoClientUri = cfg.uri;
  global._gydMongoClientPromise = promise;
  return promise;
}

/** Returns the GYD database handle */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}
