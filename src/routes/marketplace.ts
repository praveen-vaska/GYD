/**
 * /api/marketplace
 * Unified MongoDB Atlas read & incremental sync endpoint for GYD store.
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getDb, getMongoConfigState } from "../db/mongodb";
import {
  executeSyncOps,
  loadMarketplaceStateFromDb,
  syncOpSchema,
} from "../db/marketplace-sync";
import { seedDatabase } from "../db/seed";
import { verifyAdminRequest } from "./http-utils";

export const marketplaceRouter = Router();

const patchBodySchema = z.object({
  ops: z.array(syncOpSchema).min(1).max(200),
});

marketplaceRouter.get("/", async (_req: Request, res: Response) => {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    res.json({
      ok: true,
      source: "local_fallback",
      configured: false,
      reason: cfg.reason,
    });
    return;
  }

  try {
    const db = await getDb();
    const data = await loadMarketplaceStateFromDb(db);
    res.json({
      ok: true,
      source: "mongodb",
      configured: true,
      database: cfg.dbName,
      data,
    });
  } catch (err) {
    console.error("[/api/marketplace GET]", err);
    res.json({
      ok: true,
      source: "local_fallback",
      configured: true,
      reason: "connection_failed",
    });
  }
});

marketplaceRouter.patch("/", async (req: Request, res: Response) => {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    res.json({
      ok: true,
      source: "local_fallback",
      applied: 0,
    });
    return;
  }

  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "Invalid sync operations.",
      issues: parsed.error.flatten(),
    });
    return;
  }

  const verified = await verifyAdminRequest(req);

  try {
    const db = await getDb();
    const result = await executeSyncOps(db, parsed.data.ops, {
      isAdmin: verified.valid,
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.json({
      ok: true,
      source: "mongodb",
      applied: result.applied,
    });
  } catch (err) {
    console.error("[/api/marketplace PATCH]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to persist changes to MongoDB Atlas.",
    });
  }
});

marketplaceRouter.post("/", async (req: Request, res: Response) => {
  const verified = await verifyAdminRequest(req);
  if (!verified.valid) {
    res.status(401).json({
      ok: false,
      error: "Administrator authentication required.",
    });
    return;
  }

  const body = (req.body ?? {}) as { action?: string };
  if (body.action !== "RESET_SEED") {
    res.status(400).json({
      ok: false,
      error: "Unsupported marketplace action.",
    });
    return;
  }

  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    res.json({
      ok: true,
      source: "local_fallback",
      reset: true,
    });
    return;
  }

  try {
    const db = await getDb();
    const seedRes = await seedDatabase(db, { forceReset: true });
    const data = await loadMarketplaceStateFromDb(db);
    res.json({
      ok: true,
      source: "mongodb",
      counts: seedRes.counts,
      data,
    });
  } catch (err) {
    console.error("[/api/marketplace POST]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to reset MongoDB Atlas seed data.",
    });
  }
});
