/**
 * GET /api/designers
 * Fetches visible/approved designers from MongoDB Atlas (falls back to seed data if DB not configured).
 * Query params: city, category, lat, lng, radiusKm
 */
import { NextRequest, NextResponse } from "next/server";
import {
  calculateDistanceKm,
  getDesignerCoordinates,
  getDesignerNeighborhood,
} from "@/lib/location/nearby";
import { getDb, isMongoConfigured } from "@/lib/db/mongodb";
import { ensureSeeded } from "@/lib/db/seed";
import { SEED_DESIGNERS, SEED_USERS } from "@/services/mock/seed-data";
import type { DesignerProfile } from "@/types";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusParam = searchParams.get("radiusKm");

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

  return NextResponse.json({
    designers: filtered,
    total: filtered.length,
    source: dbDesigners ? "mongodb" : "seed",
  });
}
