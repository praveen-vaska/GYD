/**
 * /api/marketplace
 * Unified MongoDB Atlas read & incremental sync endpoint for GYD store.
 * - GET:   Loads live marketplace data from Atlas (auto-seeding if empty), or returns
 *          { source: "local_fallback" } cleanly when Atlas isn't configured yet.
 * - PATCH: Validates and persists incremental document operations to Atlas.
 * - POST:  Supports Admin-only { action: "RESET_SEED" } to restore factory demo seed in Atlas.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-token";
import { getDb, getMongoConfigState } from "@/lib/db/mongodb";
import {
  executeSyncOps,
  loadMarketplaceStateFromDb,
  syncOpSchema,
} from "@/lib/db/marketplace-sync";
import { seedDatabase } from "@/lib/db/seed";

const patchBodySchema = z.object({
  ops: z.array(syncOpSchema).min(1).max(200),
});

export async function GET() {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    return NextResponse.json({
      ok: true,
      source: "local_fallback",
      configured: false,
      reason: cfg.reason,
    });
  }

  try {
    const db = await getDb();
    const data = await loadMarketplaceStateFromDb(db);
    return NextResponse.json({
      ok: true,
      source: "mongodb",
      configured: true,
      database: cfg.dbName,
      data,
    });
  } catch (err) {
    console.error("[/api/marketplace GET]", err);
    return NextResponse.json({
      ok: true,
      source: "local_fallback",
      configured: true,
      reason: "connection_failed",
    });
  }
}

export async function PATCH(request: NextRequest) {
  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    return NextResponse.json({
      ok: true,
      source: "local_fallback",
      applied: 0,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid sync operations.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);

  try {
    const db = await getDb();
    const result = await executeSyncOps(db, parsed.data.ops, {
      isAdmin: verified.valid,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({
      ok: true,
      source: "mongodb",
      applied: result.applied,
    });
  } catch (err) {
    console.error("[/api/marketplace PATCH]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to persist changes to MongoDB Atlas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { ok: false, error: "Administrator authentication required." },
      { status: 401 }
    );
  }

  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (body.action !== "RESET_SEED") {
    return NextResponse.json(
      { ok: false, error: "Unsupported marketplace action." },
      { status: 400 }
    );
  }

  const cfg = getMongoConfigState();
  if (!cfg.configured) {
    return NextResponse.json({
      ok: true,
      source: "local_fallback",
      reset: true,
    });
  }

  try {
    const db = await getDb();
    const res = await seedDatabase(db, { forceReset: true });
    const data = await loadMarketplaceStateFromDb(db);
    return NextResponse.json({
      ok: true,
      source: "mongodb",
      counts: res.counts,
      data,
    });
  } catch (err) {
    console.error("[/api/marketplace POST]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to reset MongoDB Atlas seed data." },
      { status: 500 }
    );
  }
}
