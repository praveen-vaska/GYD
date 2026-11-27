/**
 * GET   /api/bookings         — list bookings (optionally ?userId=xxx or ?designerId=xxx or Bearer user)
 * POST  /api/bookings/quote   — authoritative server-side INR quote breakdown
 * POST  /api/bookings         — create a validated booking + lock slot + payment prep + conversation
 * PATCH /api/bookings?id=xxx  — update booking status
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  buildRestrictionPayload,
  extractBearerToken,
  verifyCustomerToken,
  type StoredUserRecord,
} from "../auth/customer-token";
import { sanitizeText } from "../auth/session";
import {
  SEED_AVAILABILITY,
  SEED_BOOKINGS,
  SEED_COUPONS,
  SEED_DESIGNERS,
  SEED_PLATFORM_SETTINGS,
  SEED_SERVICES,
  SEED_USERS,
} from "../data/seed-data";
import {
  ACTIVE_SLOT_HOLD_STATUSES,
  calculateBookingQuote,
} from "../lib/booking-pricing";
import type { PlatformConfigDoc } from "../db/collections";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import { generateBookingCode } from "../lib/utils";
import type {
  AvailabilitySchedule,
  Booking,
  Coupon,
  DesignerProfile,
  PlatformSettings,
  Service,
  User,
} from "../types";
import { getQueryString } from "./http-utils";

export const bookingsRouter = Router();

const appointmentTypeSchema = z.enum([
  "HOME_VISIT",
  "STUDIO_APPOINTMENT",
  "ONLINE_CONSULTATION",
  "SHOPPING_ASSISTANCE",
  "EVENT_VENUE_VISIT",
]);

const occasionSchema = z.enum([
  "Wedding",
  "Engagement",
  "Reception",
  "Birthday",
  "Festival",
  "Corporate",
  "Personal",
  "Other",
]);

const quoteSchema = z.object({
  designerId: z.string().min(1),
  serviceId: z.string().min(1),
  appointmentType: appointmentTypeSchema.default("ONLINE_CONSULTATION"),
  couponCode: z.string().optional(),
});

const createBookingSchema = z.object({
  designerId: z.string().min(1),
  serviceId: z.string().min(1),
  occasion: occasionSchema.default("Wedding"),
  appointmentType: appointmentTypeSchema.default("ONLINE_CONSULTATION"),
  date: z.string().min(4),
  startTime: z.string().min(3),
  endTime: z.string().min(3).optional(),
  slotId: z.string().optional(),
  addressLabel: z.string().max(80).default("Home"),
  addressFull: z.string().max(400).optional(),
  city: z.string().max(80).optional(),
  paymentMode: z.enum(["DEPOSIT", "FULL"]).default("DEPOSIT"),
  initiateDemoPayment: z.boolean().default(true),
  couponCode: z.string().max(40).optional(),
  requirements: z
    .object({
      occasionDate: z.string().min(4).default("2026-12-18"),
      preferredStyle: z.string().min(2).default("Modern Heritage"),
      budgetInr: z.coerce.number().min(500).default(25000),
      peopleCount: z.coerce.number().min(1).max(50).default(1),
      additionalRequirements: z
        .string()
        .min(5)
        .default("Personalized styling consultation and look coordination."),
      referenceImageNames: z.array(z.string()).default([]),
      notes: z.string().default(""),
    })
    .optional(),
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

bookingsRouter.get("/", async (req: Request, res: Response) => {
  let userId = getQueryString(req.query.userId);
  const designerId = getQueryString(req.query.designerId);

  if (!userId && !designerId) {
    const token = extractBearerToken(req);
    if (token) {
      const db = isMongoConfigured() ? await getDb() : null;
      const verified = await verifyCustomerToken(token, "access", db);
      if (verified.valid) {
        userId = verified.claims.sub;
      }
    }
  }

  const dbBookings = await getBookingsFromDb(userId, designerId);
  if (dbBookings) {
    res.json({ bookings: dbBookings, source: "mongodb" });
    return;
  }

  const bookings = SEED_BOOKINGS.filter((b) => {
    if (userId && b.customerId !== userId) return false;
    if (designerId && b.designerId !== designerId) return false;
    return true;
  });
  res.json({ bookings, source: "seed" });
});

bookingsRouter.post("/quote", async (req: Request, res: Response) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid quote request.",
    });
    return;
  }

  let service: Service | null = null;
  let coupons: Coupon[] = SEED_COUPONS;
  let settings: PlatformSettings = SEED_PLATFORM_SETTINGS;

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await ensureSeeded(db);
      const [srvDoc, couponDocs, settingsDoc] = await Promise.all([
        db
          .collection<Service>("services")
          .findOne(
            {
              id: parsed.data.serviceId,
              designerId: parsed.data.designerId,
              isActive: true,
            },
            { projection: { _id: 0 } }
          ),
        db
          .collection<Coupon>("coupons")
          .find({ isActive: true }, { projection: { _id: 0 } })
          .toArray(),
        db
          .collection<PlatformConfigDoc>("platform_config")
          .findOne({ id: "settings" }, { projection: { _id: 0 } }),
      ]);
      service = srvDoc;
      coupons = couponDocs;
      if (settingsDoc?.value) {
        settings = settingsDoc.value as PlatformSettings;
      }
    } catch (err) {
      console.error("[bookings/quote POST]", err);
    }
  }

  if (!service) {
    service =
      SEED_SERVICES.find(
        (s) =>
          s.id === parsed.data.serviceId &&
          s.designerId === parsed.data.designerId &&
          s.isActive
      ) ?? null;
  }

  if (!service) {
    res.status(404).json({ ok: false, error: "Selected service not found." });
    return;
  }

  const quote = calculateBookingQuote({
    service,
    appointmentType: parsed.data.appointmentType,
    couponCode: parsed.data.couponCode,
    coupons,
    depositPercentage: settings.depositPercentage,
  });

  res.json({ ok: true, quote });
});

bookingsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid booking payload",
      issues: parsed.error.flatten(),
    });
    return;
  }

  if (!isMongoConfigured()) {
    res.status(201).json({
      ok: true,
      mode: "SANDBOX",
      message: "Booking validated. Configure MONGODB_URI in .env to persist.",
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return;
  }

  try {
    const db = await getDb();
    await ensureSeeded(db);
    const col = db.collection<Booking>("bookings");

    const existing = await col.findOne(
      { idempotencyKey: parsed.data.idempotencyKey },
      { projection: { _id: 0 } }
    );
    if (existing) {
      res.status(200).json({
        ok: true,
        id: existing.id,
        booking: existing,
        duplicate: true,
      });
      return;
    }

    // Resolve customer identity via Bearer token (preferred) or explicit customerId
    let customerId = parsed.data.customerId ?? "usr-cust-1";
    const token = extractBearerToken(req);
    if (token) {
      const verified = await verifyCustomerToken(token, "access", db);
      if (!verified.valid) {
        res.status(401).json({
          ok: false,
          code: verified.code,
          error: "Authentication session invalid or expired.",
        });
        return;
      }
      customerId = verified.claims.sub;
    }

    const [
      customerUser,
      designer,
      service,
      schedule,
      designerBookings,
      coupons,
      settingsDoc,
      totalBookingCount,
    ] = await Promise.all([
      db
        .collection<StoredUserRecord>("users")
        .findOne({ id: customerId }, { projection: { _id: 0 } }),
      db
        .collection<DesignerProfile>("designers")
        .findOne({ id: parsed.data.designerId }, { projection: { _id: 0 } }),
      db
        .collection<Service>("services")
        .findOne(
          {
            id: parsed.data.serviceId,
            designerId: parsed.data.designerId,
            isActive: true,
          },
          { projection: { _id: 0 } }
        ),
      db
        .collection<AvailabilitySchedule>("availability")
        .findOne({ designerId: parsed.data.designerId }, { projection: { _id: 0 } }),
      col
        .find({ designerId: parsed.data.designerId }, { projection: { _id: 0 } })
        .toArray(),
      db
        .collection<Coupon>("coupons")
        .find({ isActive: true }, { projection: { _id: 0 } })
        .toArray(),
      db
        .collection<PlatformConfigDoc>("platform_config")
        .findOne({ id: "settings" }, { projection: { _id: 0 } }),
      col.countDocuments(),
    ]);

    if (!customerUser) {
      res.status(401).json({
        ok: false,
        error: "Customer account not found.",
      });
      return;
    }
    if (customerUser.status !== "ACTIVE") {
      res.status(403).json(buildRestrictionPayload(customerUser.status));
      return;
    }

    const designerOwner = designer
      ? await db
          .collection<User>("users")
          .findOne({ id: designer.userId }, { projection: { _id: 0 } })
      : null;

    if (
      !designer ||
      designer.approvalStatus !== "APPROVED" ||
      !designerOwner ||
      designerOwner.status !== "ACTIVE"
    ) {
      res.status(400).json({
        ok: false,
        error: "This designer is not currently verified/active for bookings.",
      });
      return;
    }

    if (!service) {
      res.status(404).json({
        ok: false,
        error: "Selected service is unavailable.",
      });
      return;
    }

    if (schedule?.blockedDates?.includes(parsed.data.date)) {
      res.status(409).json({
        ok: false,
        error: "The designer has blocked this date. Please select another slot.",
      });
      return;
    }

    const targetSlot = (schedule?.slots ?? []).find(
      (sl) =>
        (parsed.data.slotId && sl.id === parsed.data.slotId) ||
        (sl.date === parsed.data.date && sl.startTime === parsed.data.startTime)
    );
    if (targetSlot && !targetSlot.isAvailable) {
      res.status(409).json({
        ok: false,
        error: "This slot is already reserved. Please pick another time.",
      });
      return;
    }

    const conflict = designerBookings.find(
      (b) =>
        b.date === parsed.data.date &&
        b.startTime === parsed.data.startTime &&
        ACTIVE_SLOT_HOLD_STATUSES.has(b.status)
    );
    if (conflict) {
      res.status(409).json({
        ok: false,
        error: "This time window was just booked by another client.",
      });
      return;
    }

    const settings: PlatformSettings =
      (settingsDoc?.value as PlatformSettings | undefined) ??
      SEED_PLATFORM_SETTINGS;

    const quote = calculateBookingQuote({
      service,
      appointmentType: parsed.data.appointmentType,
      couponCode: parsed.data.couponCode,
      coupons,
      depositPercentage: settings.depositPercentage,
    });

    const bookingId = `bkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const bookingCode = generateBookingCode(totalBookingCount + 1);
    const nowIso = new Date().toISOString();

    const paymentStatus = parsed.data.initiateDemoPayment
      ? parsed.data.paymentMode === "DEPOSIT"
        ? "DEPOSIT_PAID_DEMO"
        : "PAID_DEMO"
      : "UNPAID";

    const requirements = {
      occasionDate: parsed.data.requirements?.occasionDate ?? parsed.data.date,
      preferredStyle:
        parsed.data.requirements?.preferredStyle ?? "Personalised Consultation",
      budgetInr: parsed.data.requirements?.budgetInr ?? service.priceInr,
      peopleCount: parsed.data.requirements?.peopleCount ?? 1,
      additionalRequirements: sanitizeText(
        parsed.data.requirements?.additionalRequirements ??
          parsed.data.notes ??
          "Consultation requested via GYD."
      ),
      referenceImageNames: parsed.data.requirements?.referenceImageNames ?? [],
      notes: sanitizeText(
        parsed.data.requirements?.notes ?? parsed.data.notes ?? ""
      ),
    };

    const resolvedAddress =
      parsed.data.appointmentType === "ONLINE_CONSULTATION"
        ? "GYD Encrypted Video Studio (link shared upon confirmation)"
        : sanitizeText(
            parsed.data.addressFull?.trim() ||
              `${parsed.data.addressLabel} in ${parsed.data.city || designer.city}`
          );

    const newBooking: Booking = {
      id: bookingId,
      bookingCode,
      idempotencyKey: parsed.data.idempotencyKey,
      customerId: customerUser.id,
      customerName: customerUser.name,
      designerId: designer.id,
      designerName: designer.name,
      serviceId: service.id,
      serviceTitle: service.title,
      categoryId: service.categoryId,
      occasion: parsed.data.occasion,
      appointmentType: parsed.data.appointmentType,
      date: parsed.data.date,
      startTime: targetSlot?.startTime ?? parsed.data.startTime,
      endTime: targetSlot?.endTime ?? parsed.data.endTime ?? parsed.data.startTime,
      slotId: targetSlot?.id ?? parsed.data.slotId,
      addressLabel: parsed.data.addressLabel,
      addressFull: resolvedAddress,
      city: parsed.data.city?.trim() || designer.city,
      basePriceInr: quote.basePriceInr,
      travelFeeInr: quote.travelFeeInr,
      platformServiceFeeInr: quote.platformServiceFeeInr,
      discountInr: quote.discountInr,
      totalAmountInr: quote.totalAmountInr,
      depositAmountInr: quote.depositAmountInr,
      paymentMode: parsed.data.paymentMode,
      paymentStatus,
      status: "PENDING",
      requirements,
      statusHistory: [
        {
          id: `hist-${bookingId}-1`,
          bookingId,
          status: "PENDING",
          changedByRole: "CUSTOMER",
          note: parsed.data.initiateDemoPayment
            ? "Booking request submitted with Razorpay sandbox demo hold."
            : "Booking request submitted (awaiting designer review).",
          timestamp: nowIso,
        },
      ],
      createdAt: nowIso,
    };

    const convId = `conv-${bookingId}`;
    const writes: Array<Promise<unknown>> = [
      col.insertOne(newBooking),
      db.collection("conversations").insertOne({
        id: convId,
        bookingId,
        bookingCode,
        customerId: customerUser.id,
        customerName: customerUser.name,
        customerAvatar: customerUser.avatarUrl,
        designerId: designer.id,
        designerName: designer.name,
        designerAvatar: designer.avatarUrl,
        subject: `${service.subcategoryName} · ${bookingCode}`,
        lastMessagePreview: requirements.additionalRequirements,
        unreadCountCustomer: 0,
        unreadCountDesigner: 1,
        updatedAt: nowIso,
      }),
      db.collection("messages").insertOne({
        id: `msg-${Date.now()}`,
        conversationId: convId,
        senderId: customerUser.id,
        senderName: customerUser.name,
        senderRole: "CUSTOMER",
        body: `Booking request ${bookingCode} submitted for ${newBooking.date} (${newBooking.startTime}). Notes: ${requirements.additionalRequirements}`,
        isRead: false,
        createdAt: nowIso,
      }),
      db.collection("notifications").insertOne({
        id: `notif-d-${Date.now()}`,
        userId: designer.userId,
        role: "DESIGNER",
        type: "BOOKING_RECEIVED",
        title: `New Booking Request ${bookingCode}`,
        message: `${customerUser.name} requested ${service.title} on ${newBooking.date}.`,
        linkHref: "/designer/bookings",
        isRead: false,
        createdAt: nowIso,
      }),
    ];

    if (parsed.data.initiateDemoPayment) {
      writes.push(
        db.collection("payments").insertOne({
          id: `pay-${Date.now()}`,
          bookingId,
          bookingCode,
          customerName: customerUser.name,
          designerName: designer.name,
          gateway: "RAZORPAY_TEST_SANDBOX",
          gatewayOrderId: `order_gyd_demo_${Date.now().toString().slice(-6)}`,
          amountInr:
            parsed.data.paymentMode === "DEPOSIT"
              ? quote.depositAmountInr
              : quote.totalAmountInr,
          paymentMode: parsed.data.paymentMode,
          status: paymentStatus,
          createdAt: nowIso,
        })
      );
    }

    if (schedule) {
      const updatedSlots = schedule.slots.map((sl) =>
        (targetSlot && sl.id === targetSlot.id) ||
        (sl.date === newBooking.date && sl.startTime === newBooking.startTime)
          ? { ...sl, isAvailable: false, bookedByBookingId: bookingId }
          : sl
      );
      writes.push(
        db
          .collection("availability")
          .updateOne({ designerId: designer.id }, { $set: { slots: updatedSlots } })
      );
    }

    await Promise.all(writes);
    res.status(201).json({
      ok: true,
      id: bookingId,
      booking: newBooking,
      source: "mongodb",
    });
  } catch (err) {
    console.error("[bookings POST]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to submit booking request.",
    });
  }
});

bookingsRouter.patch("/", async (req: Request, res: Response) => {
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
    const parsed = patchBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid update payload",
        issues: parsed.error.flatten(),
      });
      return;
    }
    const db = await getDb();
    await db
      .collection("bookings")
      .updateOne(
        { id },
        { $set: { ...parsed.data, updatedAt: new Date().toISOString() } }
      );
    res.json({ ok: true });
  } catch (err) {
    console.error("[bookings PATCH]", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Touch SEED_DESIGNERS import so fallback check remains explicit
void SEED_DESIGNERS;
void SEED_AVAILABILITY;
void SEED_USERS;
