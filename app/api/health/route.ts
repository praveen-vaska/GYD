/**
 * GET /api/health
 * Returns server status + real MongoDB Atlas ping & collection counts.
 */
import { NextResponse } from "next/server";
import { getDb, getMongoConfigState } from "@/lib/db/mongodb";

export async function GET() {
  const cfg = getMongoConfigState();
  let mongoStatus:
    | "connected"
    | "disconnected"
    | "needs_password"
    | "invalid_uri"
    | "not_configured" = cfg.configured ? "disconnected" : cfg.reason;
  let collectionsCount: number | undefined;
  let designersCount: number | undefined;
  let bookingsCount: number | undefined;

  if (cfg.configured) {
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      mongoStatus = "connected";
      const [cols, dCount, bCount] = await Promise.all([
        db.listCollections().toArray(),
        db.collection("designers").countDocuments(),
        db.collection("bookings").countDocuments(),
      ]);
      collectionsCount = cols.length;
      designersCount = dCount;
      bookingsCount = bCount;
    } catch {
      mongoStatus = "disconnected";
    }
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: {
      configured: cfg.configured,
      status: mongoStatus,
      database: cfg.dbName,
      collectionsCount,
      designersCount,
      bookingsCount,
    },
    version: process.env.npm_package_version ?? "0.1.0",
  });
}
