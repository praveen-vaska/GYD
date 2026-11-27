/**
 * GET /api/health
 * Returns server status + real MongoDB Atlas ping & collection counts.
 */
import { Router, type Request, type Response } from "express";
import { getDb, getMongoConfigState } from "../db/mongodb";
import { getQueryString } from "./http-utils";

export const healthRouter = Router();

healthRouter.get("/", async (req: Request, res: Response) => {
  const fast = getQueryString(req.query.fast) === "1";
  const cfg = getMongoConfigState();
  let mongoStatus:
    | "connected"
    | "configured"
    | "disconnected"
    | "needs_password"
    | "invalid_uri"
    | "not_configured" = !cfg.configured
    ? cfg.reason
    : fast
      ? "configured"
      : "disconnected";
  let collectionsCount: number | undefined;
  let designersCount: number | undefined;
  let bookingsCount: number | undefined;

  if (cfg.configured && !fast) {
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

  res.json({
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
    version: process.env.npm_package_version ?? "1.0.0",
  });
});
