/**
 * GET    /api/categories         — list active categories from MongoDB (or seed fallback)
 * POST   /api/categories         — create a category (Admin auth required)
 * DELETE /api/categories?id=xxx  — delete a category (Admin auth required)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-token";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { ensureSeeded } from "@/lib/db/seed";
import { SEED_CATEGORIES } from "@/services/mock/seed-data";

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

export async function GET() {
  const dbCats = await getCategoriesFromDb();
  if (dbCats) {
    return NextResponse.json({ categories: dbCats, source: "mongodb" });
  }
  const categories = SEED_CATEGORIES.filter((c) => c.isActive).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  return NextResponse.json({ categories, source: "seed" });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Administrator authentication required." },
      { status: 401 }
    );
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid category payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
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
    return NextResponse.json({ ok: true, id: catId }, { status: 201 });
  } catch (err) {
    console.error("[categories POST]", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Administrator authentication required." },
      { status: 401 }
    );
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  try {
    const db = await getDb();
    await db.collection("categories").deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[categories DELETE]", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
