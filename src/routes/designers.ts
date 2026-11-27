/**
 * GET /api/designers       — list visible/approved designers with location enrichment
 * GET /api/designers/:id   — fetch full designer profile, services, packages,
 *                            portfolios, live slot calendar, published reviews & FAQs
 */
import { Router, type Request, type Response } from "express";
import {
  SEED_AVAILABILITY,
  SEED_BOOKINGS,
  SEED_COUPONS,
  SEED_DESIGNERS,
  SEED_PLATFORM_SETTINGS,
  SEED_PORTFOLIOS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_USERS,
} from "../data/seed-data";
import { applyBookingSlotLocks } from "../lib/booking-pricing";
import type { PlatformConfigDoc } from "../db/collections";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import {
  calculateDistanceKm,
  getDesignerCoordinates,
  getDesignerNeighborhood,
} from "../lib/location/nearby";
import type {
  AvailabilitySchedule,
  Booking,
  Coupon,
  DesignerProfile,
  PlatformSettings,
  Portfolio,
  Review,
  Service,
  User,
} from "../types";
import { getQueryString } from "./http-utils";

export const designersRouter = Router();

async function getDesignersFromDb(): Promise<DesignerProfile[] | null> {
  if (!isMongoConfigured()) return null;
  try {
    const db = await getDb();
    await ensureSeeded(db);
    const [docs, activeUsers] = await Promise.all([
      db
        .collection("designers")
        .find({ approvalStatus: "APPROVED" }, { projection: { _id: 0 } })
        .toArray(),
      db
        .collection("users")
        .find({ status: "ACTIVE" }, { projection: { _id: 0, id: 1 } })
        .toArray(),
    ]);
    const activeIds = new Set(activeUsers.map((u) => u.id as string));
    return (docs as unknown as DesignerProfile[]).filter((d) =>
      activeIds.has(d.userId)
    );
  } catch {
    return null;
  }
}

designersRouter.get("/", async (req: Request, res: Response) => {
  const city = getQueryString(req.query.city);
  const category = getQueryString(req.query.category);
  const latParam = getQueryString(req.query.lat);
  const lngParam = getQueryString(req.query.lng);
  const radiusParam = getQueryString(req.query.radiusKm);

  const userLat = latParam !== null ? Number(latParam) : null;
  const userLng = lngParam !== null ? Number(lngParam) : null;
  const maxRadius = radiusParam !== null ? Number(radiusParam) : null;
  const hasCoords =
    userLat !== null &&
    userLng !== null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng);

  const dbDesigners = await getDesignersFromDb();
  const activeSeedIds = new Set(
    SEED_USERS.filter((u) => u.status === "ACTIVE").map((u) => u.id)
  );
  const source =
    dbDesigners ??
    SEED_DESIGNERS.filter(
      (d) => d.approvalStatus === "APPROVED" && activeSeedIds.has(d.userId)
    );

  const enriched = source
    .filter((d) => {
      if (d.approvalStatus !== "APPROVED") return false;
      if (
        !hasCoords &&
        city &&
        city !== "All Cities" &&
        d.city.toLowerCase() !== city.toLowerCase()
      ) {
        return false;
      }
      if (
        category &&
        d.categoryNames &&
        !d.categoryNames.some((c: string) =>
          c.toLowerCase().includes(category.toLowerCase())
        )
      ) {
        return false;
      }
      return true;
    })
    .map((d) => {
      const coords = getDesignerCoordinates(d);
      const distanceKm = hasCoords
        ? calculateDistanceKm(userLat!, userLng!, coords.lat, coords.lng)
        : null;
      return {
        ...d,
        neighborhood: getDesignerNeighborhood(d),
        distanceKm,
      };
    });

  const filtered =
    hasCoords && maxRadius && Number.isFinite(maxRadius)
      ? enriched.filter((d) => (d.distanceKm ?? 9999) <= maxRadius)
      : enriched;

  if (hasCoords) {
    filtered.sort(
      (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999)
    );
  }

  res.json({
    designers: filtered,
    total: filtered.length,
    source: dbDesigners ? "mongodb" : "seed",
  });
});

designersRouter.get("/:id", async (req: Request, res: Response) => {
  const designerId = getQueryString(req.params.id)?.trim();
  if (!designerId) {
    res.status(400).json({ ok: false, error: "Designer ID is required." });
    return;
  }

  const latParam = getQueryString(req.query.lat);
  const lngParam = getQueryString(req.query.lng);
  const userLat = latParam !== null ? Number(latParam) : null;
  const userLng = lngParam !== null ? Number(lngParam) : null;
  const hasCoords =
    userLat !== null &&
    userLng !== null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng);

  let source: "mongodb" | "seed" = "seed";
  let designer: DesignerProfile | null = null;
  let owner: User | null = null;
  let services: Service[] = [];
  let portfolios: Portfolio[] = [];
  let schedule: AvailabilitySchedule | null = null;
  let designerBookings: Booking[] = [];
  let reviews: Review[] = [];
  let coupons: Coupon[] = [];
  let settings: PlatformSettings = SEED_PLATFORM_SETTINGS;

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await ensureSeeded(db);
      source = "mongodb";
      designer = await db
        .collection<DesignerProfile>("designers")
        .findOne({ id: designerId }, { projection: { _id: 0 } });

      if (designer) {
        const [
          ownerDoc,
          srvDocs,
          portDocs,
          availDoc,
          bkgDocs,
          revDocs,
          couponDocs,
          settingsDoc,
        ] = await Promise.all([
          db
            .collection<User>("users")
            .findOne({ id: designer.userId }, { projection: { _id: 0 } }),
          db
            .collection<Service>("services")
            .find(
              { designerId: designer.id, isActive: true },
              { projection: { _id: 0 } }
            )
            .toArray(),
          db
            .collection<Portfolio>("portfolios")
            .find({ designerId: designer.id }, { projection: { _id: 0 } })
            .sort({ createdAt: -1 })
            .toArray(),
          db
            .collection<AvailabilitySchedule>("availability")
            .findOne({ designerId: designer.id }, { projection: { _id: 0 } }),
          db
            .collection<Booking>("bookings")
            .find({ designerId: designer.id }, { projection: { _id: 0 } })
            .toArray(),
          db
            .collection<Review>("reviews")
            .find(
              { designerId: designer.id, moderationStatus: "PUBLISHED" },
              { projection: { _id: 0 } }
            )
            .sort({ createdAt: -1 })
            .toArray(),
          db
            .collection<Coupon>("coupons")
            .find({ isActive: true }, { projection: { _id: 0 } })
            .toArray(),
          db
            .collection<PlatformConfigDoc>("platform_config")
            .findOne({ id: "settings" }, { projection: { _id: 0 } }),
        ]);

        owner = ownerDoc;
        services = srvDocs;
        portfolios = portDocs;
        schedule = availDoc;
        designerBookings = bkgDocs;
        reviews = revDocs;
        coupons = couponDocs;
        if (settingsDoc?.value) {
          settings = settingsDoc.value as PlatformSettings;
        }
      }
    } catch (err) {
      console.error("[designers/:id GET]", err);
      source = "seed";
    }
  }

  if (source === "seed") {
    designer = SEED_DESIGNERS.find((d) => d.id === designerId) ?? null;
    if (designer) {
      owner = SEED_USERS.find((u) => u.id === designer!.userId) ?? null;
      services = SEED_SERVICES.filter(
        (s) => s.designerId === designer!.id && s.isActive
      );
      portfolios = SEED_PORTFOLIOS.filter((p) => p.designerId === designer!.id);
      schedule =
        SEED_AVAILABILITY.find((a) => a.designerId === designer!.id) ?? null;
      designerBookings = SEED_BOOKINGS.filter(
        (b) => b.designerId === designer!.id
      );
      reviews = SEED_REVIEWS.filter(
        (r) =>
          r.designerId === designer!.id && r.moderationStatus === "PUBLISHED"
      );
      coupons = SEED_COUPONS.filter((c) => c.isActive);
      settings = SEED_PLATFORM_SETTINGS;
    }
  }

  const isSuspendedOrBlocked =
    !designer ||
    designer.approvalStatus === "SUSPENDED" ||
    designer.approvalStatus === "REJECTED" ||
    !owner ||
    owner.status !== "ACTIVE";

  if (isSuspendedOrBlocked || !designer) {
    res.status(404).json({
      ok: false,
      error:
        "This designer profile is unavailable or currently restricted by moderation.",
    });
    return;
  }

  const isPubliclyBookable =
    !settings.requireDesignerVerification ||
    designer.approvalStatus === "APPROVED";

  const coords = getDesignerCoordinates(designer);
  const distanceKm = hasCoords
    ? calculateDistanceKm(userLat!, userLng!, coords.lat, coords.lng)
    : null;

  const availability = applyBookingSlotLocks(schedule, designerBookings);

  res.json({
    ok: true,
    source,
    designer: {
      ...designer,
      neighborhood: getDesignerNeighborhood(designer),
      distanceKm,
    },
    isPubliclyBookable,
    services,
    portfolios,
    availability,
    reviews,
    coupons,
    settings: {
      depositPercentage: settings.depositPercentage,
      requireDesignerVerification: settings.requireDesignerVerification,
      privacySummary: settings.privacySummary,
      termsSummary: settings.termsSummary,
    },
  });
});
