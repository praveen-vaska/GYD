/**
 * GET   /api/users          — list users (Admin auth required)
 * POST  /api/users          — register a new customer user
 * PATCH /api/users?id=xxx   — update user status/profile (Admin auth required)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-token";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { ensureSeeded } from "@/lib/db/seed";
import { SEED_USERS } from "@/services/mock/seed-data";

const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30).default(""),
  city: z.string().min(2).max(80).default("Hyderabad"),
});

const patchUserSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(6).max(30).optional(),
  city: z.string().min(2).max(80).optional(),
});

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Administrator authentication required." },
      { status: 401 }
    );
  }

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await ensureSeeded(db);
      const users = await db
        .collection("users")
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return NextResponse.json({ users, source: "mongodb" });
    } catch {
      // fall through
    }
  }
  return NextResponse.json({ users: SEED_USERS, source: "seed" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid user registration payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          ok: true,
          mode: "SANDBOX",
          message: "Set MONGODB_URI in .env.local to persist users in MongoDB Atlas.",
        },
        { status: 201 }
      );
    }

    const db = await getDb();
    await ensureSeeded(db);
    const col = db.collection("users");
    const email = parsed.data.email.trim().toLowerCase();
    const existing = await col.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const userId = `usr-cust-${Date.now()}`;
    const doc = {
      id: userId,
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone.trim(),
      city: parsed.data.city.trim(),
      role: "CUSTOMER",
      status: "ACTIVE",
      avatarUrl: "/images/designers/designer-06.jpg",
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(doc);
    return NextResponse.json({ ok: true, id: userId, source: "mongodb" }, { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Administrator authentication required." },
      { status: 401 }
    );
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid patch payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const db = await getDb();
    await db
      .collection("users")
      .updateOne(
        { id },
        { $set: { ...parsed.data, updatedAt: new Date().toISOString() } }
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[users PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
