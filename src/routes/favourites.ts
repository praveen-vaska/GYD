import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  extractBearerToken,
  verifyCustomerToken,
} from "../auth/customer-token";
import { SEED_FAVOURITES } from "../data/seed-data";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import type { Favourite } from "../types";

export const favouritesRouter = Router();

const toggleSchema = z.object({
  designerId: z.string().min(1),
});

favouritesRouter.get("/", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ ok: false, error: "Authentication required." });
    return;
  }

  try {
    const db = isMongoConfigured() ? await getDb() : null;
    if (db) await ensureSeeded(db);

    const verified = await verifyCustomerToken(token, "access", db);
    if (!verified.valid) {
      res.status(401).json({ ok: false, code: verified.code, error: "Invalid session." });
      return;
    }

    if (!db) {
      const ids = SEED_FAVOURITES.filter(
        (f) => f.customerId === verified.claims.sub
      ).map((f) => f.designerId);
      res.json({ ok: true, designerIds: ids, source: "seed" });
      return;
    }

    const docs = await db
      .collection<Favourite>("favourites")
      .find({ customerId: verified.claims.sub }, { projection: { _id: 0 } })
      .toArray();
    res.json({
      ok: true,
      designerIds: docs.map((d) => d.designerId),
      source: "mongodb",
    });
  } catch (err) {
    console.error("[favourites GET]", err);
    res.status(500).json({ ok: false, error: "Failed to load favourites." });
  }
});

favouritesRouter.post("/toggle", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ ok: false, error: "Authentication required." });
    return;
  }

  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "designerId is required." });
    return;
  }

  try {
    const db = isMongoConfigured() ? await getDb() : null;
    if (db) await ensureSeeded(db);

    const verified = await verifyCustomerToken(token, "access", db);
    if (!verified.valid) {
      res.status(401).json({ ok: false, code: verified.code, error: "Invalid session." });
      return;
    }

    if (!db) {
      res.json({
        ok: true,
        isFavourited: true,
        designerIds: [parsed.data.designerId],
        source: "seed",
      });
      return;
    }

    const col = db.collection<Favourite>("favourites");
    const existing = await col.findOne(
      { customerId: verified.claims.sub, designerId: parsed.data.designerId },
      { projection: { _id: 0 } }
    );

    let isFavourited = false;
    if (existing) {
      await col.deleteOne({ id: existing.id });
      isFavourited = false;
    } else {
      await col.insertOne({
        id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        customerId: verified.claims.sub,
        designerId: parsed.data.designerId,
        createdAt: new Date().toISOString(),
      });
      isFavourited = true;
    }

    const updatedDocs = await col
      .find({ customerId: verified.claims.sub }, { projection: { _id: 0 } })
      .toArray();

    res.json({
      ok: true,
      isFavourited,
      designerIds: updatedDocs.map((d) => d.designerId),
      source: "mongodb",
    });
  } catch (err) {
    console.error("[favourites/toggle POST]", err);
    res.status(500).json({ ok: false, error: "Failed to update wishlist." });
  }
});
