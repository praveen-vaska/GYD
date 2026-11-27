/**
 * GET   /api/users          — list users (Admin auth required)
 * POST  /api/users          — register a new customer user
 * PATCH /api/users?id=xxx   — update user status/profile (Admin auth required)
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { SEED_USERS } from "../data/seed-data";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import { getQueryString, verifyAdminRequest } from "./http-utils";

export const usersRouter = Router();

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

usersRouter.get("/", async (req: Request, res: Response) => {
  const verified = await verifyAdminRequest(req);
  if (!verified.valid) {
    res.status(401).json({ error: "Administrator authentication required." });
    return;
  }

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await ensureSeeded(db);
      const users = await db
        .collection("users")
        .find({}, { projection: { _id: 0, passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      res.json({ users, source: "mongodb" });
      return;
    } catch {
      // fall through
    }
  }
  res.json({ users: SEED_USERS, source: "seed" });
});

usersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = registerUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid user registration payload",
        issues: parsed.error.flatten(),
      });
      return;
    }

    if (!isMongoConfigured()) {
      res.status(201).json({
        ok: true,
        mode: "SANDBOX",
        message: "Set MONGODB_URI in .env to persist users in MongoDB Atlas.",
      });
      return;
    }

    const db = await getDb();
    await ensureSeeded(db);
    const col = db.collection("users");
    const email = parsed.data.email.trim().toLowerCase();
    const existing = await col.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
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
    res.status(201).json({ ok: true, id: userId, source: "mongodb" });
  } catch (err) {
    console.error("[users POST]", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

usersRouter.patch("/", async (req: Request, res: Response) => {
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
    res.status(400).json({ error: "id required" });
    return;
  }

  try {
    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid patch payload",
        issues: parsed.error.flatten(),
      });
      return;
    }
    const db = await getDb();
    await db
      .collection("users")
      .updateOne(
        { id },
        { $set: { ...parsed.data, updatedAt: new Date().toISOString() } }
      );
    res.json({ ok: true });
  } catch (err) {
    console.error("[users PATCH]", err);
    res.status(500).json({ error: "Update failed" });
  }
});
