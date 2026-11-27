/**
 * GET    /api/categories         — list active categories from MongoDB (or seed fallback)
 * POST   /api/categories         — create a category (Admin auth required)
 * DELETE /api/categories?id=xxx  — delete a category (Admin auth required)
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { SEED_CATEGORIES } from "../data/seed-data";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import { getQueryString, verifyAdminRequest } from "./http-utils";

export const categoriesRouter = Router();

const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80),
  groupName: z.string().min(2).max(80).default("Fashion & Personal Styling"),
  description: z.string().min(4).max(400).default(""),
  imageUrl: z
    .string()
    .min(1)
    .default("/images/categories/wedding-styling.jpg"),
  commissionRate: z.number().min(0).max(50).default(15),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

async function getCategoriesFromDb() {
  if (!isMongoConfigured()) return null;
  try {
    const db = await getDb();
    await ensureSeeded(db);
    const docs = await db
      .collection("categories")
      .find({ isActive: true }, { projection: { _id: 0 } })
      .sort({ sortOrder: 1 })
      .toArray();
    return docs;
  } catch {
    return null;
  }
}

categoriesRouter.get("/", async (_req: Request, res: Response) => {
  const dbCats = await getCategoriesFromDb();
  if (dbCats) {
    res.json({ categories: dbCats, source: "mongodb" });
    return;
  }
  const categories = SEED_CATEGORIES.filter((c) => c.isActive).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  res.json({ categories, source: "seed" });
});

categoriesRouter.post("/", async (req: Request, res: Response) => {
  const verified = await verifyAdminRequest(req);
  if (!verified.valid) {
    res.status(401).json({ error: "Administrator authentication required." });
    return;
  }
  if (!isMongoConfigured()) {
    res.status(503).json({
      error: "Database not configured. Set MONGODB_URI in .env",
    });
    return;
  }
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid category payload",
        issues: parsed.error.flatten(),
      });
      return;
    }
    const db = await getDb();
    const col = db.collection("categories");
    const catId = `cat-${Date.now()}`;
    const count = await col.countDocuments();
    const doc = {
      id: catId,
      ...parsed.data,
      isActive: true,
      sortOrder: parsed.data.sortOrder ?? count + 1,
      subcategories: [],
    };
    await col.insertOne(doc);
    res.status(201).json({ ok: true, id: catId });
  } catch (err) {
    console.error("[categories POST]", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

categoriesRouter.delete("/", async (req: Request, res: Response) => {
  const verified = await verifyAdminRequest(req);
  if (!verified.valid) {
    res.status(401).json({ error: "Administrator authentication required." });
    return;
  }
  if (!isMongoConfigured()) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }
  const id = getQueryString(req.query.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  try {
    const db = await getDb();
    await db.collection("categories").deleteOne({ id });
    res.json({ ok: true });
  } catch (err) {
    console.error("[categories DELETE]", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});
