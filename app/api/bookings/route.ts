/**
 * GET   /api/bookings         — list bookings (optionally ?userId=xxx or ?designerId=xxx)
 * POST  /api/bookings         — create a validated booking
 * PATCH /api/bookings?id=xxx  — update booking status
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { ensureSeeded } from "@/lib/db/seed";
import { generateBookingCode } from "@/lib/utils";
import { SEED_BOOKINGS } from "@/services/mock/seed-data";

const createBookingSchema = z.object({
  designerId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(4),
  startTime: z.string().min(3),
  endTime: z.string().min(3).optional(),
  idempotencyKey: z.string().min(4),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

const patchBookingSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "ACCEPTED",
      "REJECTED",
      "AWAITING_PAYMENT",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REFUND_REQUESTED",
      "REFUNDED",
    ])
    .optional(),
  rejectionReason: z.string().max(400).optional(),
  rescheduleSuggestedSlot: z.string().max(200).optional(),
  cancellationReason: z.string().max(400).optional(),
});

async function getBookingsFromDb(userId?: string | null, designerId?: string | null) {
  if (!isMongoConfigured()) return null;
  try {
    const db = await getDb();
    await ensureSeeded(db);
    const filter: Record<string, string> = {};
    if (userId) filter.customerId = userId;
    if (designerId) filter.designerId = designerId;
    const docs = await db
      .collection("bookings")
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const designerId = searchParams.get("designerId");

  const dbBookings = await getBookingsFromDb(userId, designerId);
  if (dbBookings) {
    return NextResponse.json({ bookings: dbBookings, source: "mongodb" });
  }

  const bookings = SEED_BOOKINGS.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    paymentStatus: b.paymentStatus,
    date: b.date,
    city: b.city,
  }));
  return NextResponse.json({ bookings, source: "seed" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          ok: true,
          mode: "SANDBOX",
          message: "Booking validated. Configure MONGODB_URI in .env.local to persist.",
          idempotencyKey: parsed.data.idempotencyKey,
        },
        { status: 201 }
      );
    }

    const db = await getDb();
    await ensureSeeded(db);
    const col = db.collection("bookings");

    const existing = await col.findOne(
      { idempotencyKey: parsed.data.idempotencyKey },
      { projection: { _id: 0 } }
    );
    if (existing) {
      return NextResponse.json(
        { ok: true, id: existing.id, duplicate: true },
        { status: 200 }
      );
    }

    const count = await col.countDocuments();
    const bookingId = `bkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const doc = {
      id: bookingId,
      bookingCode: generateBookingCode(count + 1),
      ...parsed.data,
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await col.insertOne(doc);
    return NextResponse.json(
      { ok: true, id: bookingId, source: "mongodb" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[bookings POST]", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = patchBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const db = await getDb();
    await db
      .collection("bookings")
      .updateOne(
        { id },
        { $set: { ...parsed.data, updatedAt: new Date().toISOString() } }
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bookings PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
