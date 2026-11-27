/**
 * Shared MongoDB marketplace state loader & operation-level sync engine.
 * Reads full shared collections cleanly without leaking MongoDB `_id` values,
 * and validates/executes incremental mutations with role-aware checks.
 */
import type { Db } from "mongodb";
import { z } from "zod";
import {
  SEED_CMS,
  SEED_PLATFORM_SETTINGS,
} from "../data/seed-data";
import type {
  Address,
  AdminAuditLog,
  AvailabilitySchedule,
  Booking,
  Category,
  CmsContent,
  Commission,
  Conversation,
  Coupon,
  CustomerProfile,
  DesignerProfile,
  DesignerVerification,
  Favourite,
  Message,
  NotificationItem,
  Payment,
  Payout,
  PlatformSettings,
  Portfolio,
  Refund,
  Review,
  Service,
  User,
} from "../types";
import {
  ENTITY_COLLECTIONS,
  getCollectionDocs,
  getEntityKeyField,
  type PlatformConfigDoc,
} from "./collections";
import { ensureSeeded } from "./seed";

export interface MarketplaceSnapshot {
  users: User[];
  customers: CustomerProfile[];
  addresses: Address[];
  categories: Category[];
  designers: DesignerProfile[];
  services: Service[];
  portfolios: Portfolio[];
  availability: AvailabilitySchedule[];
  verifications: DesignerVerification[];
  bookings: Booking[];
  payments: Payment[];
  refunds: Refund[];
  commissions: Commission[];
  payouts: Payout[];
  reviews: Review[];
  conversations: Conversation[];
  messages: Message[];
  notifications: NotificationItem[];
  favourites: Favourite[];
  coupons: Coupon[];
  settings: PlatformSettings;
  cms: CmsContent;
  auditLogs: AdminAuditLog[];
}

const ENTITY_COLLECTION_ENUM = z.enum(ENTITY_COLLECTIONS);

export const syncOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("upsert"),
    collection: ENTITY_COLLECTION_ENUM,
    doc: z.record(z.string(), z.unknown()),
  }),
  z.object({
    op: z.literal("patch"),
    collection: ENTITY_COLLECTION_ENUM,
    id: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({
    op: z.literal("delete"),
    collection: ENTITY_COLLECTION_ENUM,
    id: z.string().min(1),
  }),
  z.object({
    op: z.literal("deleteMany"),
    collection: ENTITY_COLLECTION_ENUM,
    filter: z.record(z.string(), z.string().min(1)),
  }),
  z.object({
    op: z.literal("patchConfig"),
    key: z.enum(["settings", "cms"]),
    patch: z.record(z.string(), z.unknown()),
  }),
]);

export type SyncOp = z.infer<typeof syncOpSchema>;

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype", "_id"]);

function sanitizeRecord(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (
      FORBIDDEN_KEYS.has(key) ||
      key.startsWith("$") ||
      key.includes(".") ||
      val === undefined
    ) {
      continue;
    }
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      clean[key] = sanitizeRecord(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      clean[key] = val.map((item) =>
        item !== null && typeof item === "object" && !Array.isArray(item)
          ? sanitizeRecord(item as Record<string, unknown>)
          : item
      );
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const ALLOWED_DELETE_MANY_FIELDS = new Set([
  "designerId",
  "userId",
  "customerId",
  "bookingId",
  "conversationId",
]);

const CUSTOMER_SAFE_USER_PATCH_KEYS = new Set(["name", "phone", "city"]);

const DESIGNER_SAFE_PATCH_KEYS = new Set([
  "title",
  "city",
  "serviceRadiusKm",
  "bio",
  "startingPriceInr",
  "supportedAppointmentTypes",
  "rating",
  "reviewCount",
]);

function checkOpAuthorization(op: SyncOp, isAdmin: boolean): string | null {
  if (isAdmin) return null;

  if (op.op === "patchConfig") {
    return "Administrator authentication required to update platform configuration.";
  }

  switch (op.collection) {
    case "audit_logs":
    case "payouts":
    case "coupons":
    case "categories":
      return `Administrator authentication required to modify ${op.collection}.`;

    case "refunds":
      if (op.op !== "upsert" || op.doc.status !== "REQUESTED") {
        return "Administrator authentication required to moderate refunds.";
      }
      return null;

    case "verifications":
      if (op.op !== "upsert") {
        return "Administrator authentication required to moderate verifications.";
      }
      return null;

    case "reviews":
      if (op.op !== "upsert") {
        return "Administrator authentication required to moderate reviews.";
      }
      return null;

    case "users":
      if (op.op === "delete" || op.op === "deleteMany") {
        return "Administrator authentication required to remove users.";
      }
      if (op.op === "upsert") {
        if (op.doc.role === "ADMIN") {
          return "Administrator accounts cannot be created via public registration.";
        }
        return null;
      }
      if (op.op === "patch") {
        const keys = Object.keys(op.patch);
        const unauthorized = keys.some(
          (k) => !CUSTOMER_SAFE_USER_PATCH_KEYS.has(k)
        );
        if (unauthorized) {
          return "Administrator authentication required to change account status or role.";
        }
        return null;
      }
      return null;

    case "designers":
      if (op.op === "delete" || op.op === "deleteMany") {
        return "Administrator authentication required to remove designers.";
      }
      if (op.op === "upsert") {
        return null;
      }
      if (op.op === "patch") {
        const keys = Object.keys(op.patch);
        const unauthorized = keys.some((k) => !DESIGNER_SAFE_PATCH_KEYS.has(k));
        if (unauthorized) {
          return "Administrator authentication required to alter verification, approval, featured status, or commission overrides.";
        }
        return null;
      }
      return null;

    default:
      return null;
  }
}

export async function loadMarketplaceStateFromDb(
  db: Db
): Promise<MarketplaceSnapshot> {
  await ensureSeeded(db);

  const [
    users,
    customers,
    addresses,
    categories,
    designers,
    services,
    portfolios,
    availability,
    verifications,
    bookings,
    payments,
    refunds,
    commissions,
    payouts,
    reviews,
    conversations,
    messages,
    notifications,
    favourites,
    coupons,
    auditLogs,
    configDocs,
  ] = await Promise.all([
    getCollectionDocs<User>(db, "users", { createdAt: -1 }),
    getCollectionDocs<CustomerProfile>(db, "customers"),
    getCollectionDocs<Address>(db, "addresses"),
    getCollectionDocs<Category>(db, "categories", { sortOrder: 1 }),
    getCollectionDocs<DesignerProfile>(db, "designers"),
    getCollectionDocs<Service>(db, "services"),
    getCollectionDocs<Portfolio>(db, "portfolios", { createdAt: -1 }),
    getCollectionDocs<AvailabilitySchedule>(db, "availability"),
    getCollectionDocs<DesignerVerification>(db, "verifications", {
      submittedAt: -1,
    }),
    getCollectionDocs<Booking>(db, "bookings", { createdAt: -1 }),
    getCollectionDocs<Payment>(db, "payments", { createdAt: -1 }),
    getCollectionDocs<Refund>(db, "refunds", { createdAt: -1 }),
    getCollectionDocs<Commission>(db, "commissions", { createdAt: -1 }),
    getCollectionDocs<Payout>(db, "payouts"),
    getCollectionDocs<Review>(db, "reviews", { createdAt: -1 }),
    getCollectionDocs<Conversation>(db, "conversations", { updatedAt: -1 }),
    getCollectionDocs<Message>(db, "messages", { createdAt: 1 }),
    getCollectionDocs<NotificationItem>(db, "notifications", { createdAt: -1 }),
    getCollectionDocs<Favourite>(db, "favourites", { createdAt: -1 }),
    getCollectionDocs<Coupon>(db, "coupons"),
    getCollectionDocs<AdminAuditLog>(db, "audit_logs", { createdAt: -1 }),
    db
      .collection<PlatformConfigDoc>("platform_config")
      .find({}, { projection: { _id: 0 } })
      .toArray(),
  ]);

  const settingsDoc = configDocs.find((d) => d.id === "settings");
  const cmsDoc = configDocs.find((d) => d.id === "cms");

  return {
    users,
    customers,
    addresses,
    categories: [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    designers,
    services,
    portfolios,
    availability,
    verifications,
    bookings,
    payments,
    refunds,
    commissions,
    payouts,
    reviews,
    conversations,
    messages,
    notifications,
    favourites,
    coupons,
    settings: (settingsDoc?.value as PlatformSettings) ?? SEED_PLATFORM_SETTINGS,
    cms: (cmsDoc?.value as CmsContent) ?? SEED_CMS,
    auditLogs,
  };
}

export async function executeSyncOps(
  db: Db,
  ops: SyncOp[],
  options: { isAdmin: boolean }
): Promise<{ ok: true; applied: number } | { ok: false; error: string; status: number }> {
  await ensureSeeded(db);

  for (const op of ops) {
    const authErr = checkOpAuthorization(op, options.isAdmin);
    if (authErr) {
      return { ok: false, error: authErr, status: 403 };
    }
  }

  let applied = 0;
  for (const op of ops) {
    if (op.op === "patchConfig") {
      const cleanPatch = sanitizeRecord(op.patch);
      const col = db.collection<PlatformConfigDoc>("platform_config");
      const existing = await col.findOne(
        { id: op.key },
        { projection: { _id: 0 } }
      );
      const baseValue =
        existing?.value ??
        (op.key === "settings" ? SEED_PLATFORM_SETTINGS : SEED_CMS);
      await col.replaceOne(
        { id: op.key },
        {
          id: op.key,
          value: { ...baseValue, ...cleanPatch } as PlatformSettings | CmsContent,
          updatedAt: new Date().toISOString(),
        },
        { upsert: true }
      );
      applied += 1;
      continue;
    }

    const col = db.collection(op.collection);
    const keyField = getEntityKeyField(op.collection);

    if (op.op === "upsert") {
      const cleanDoc = sanitizeRecord(op.doc);
      if (!options.isAdmin && op.collection === "designers") {
        const settingsDoc = await db
          .collection<PlatformConfigDoc>("platform_config")
          .findOne({ id: "settings" }, { projection: { _id: 0 } });
        const requireVer =
          (settingsDoc?.value as PlatformSettings | undefined)
            ?.requireDesignerVerification ?? true;
        cleanDoc.isFeatured = false;
        if (requireVer) {
          cleanDoc.approvalStatus = "PENDING_REVIEW";
          cleanDoc.isVerified = false;
        }
      } else if (!options.isAdmin && op.collection === "verifications") {
        const settingsDoc = await db
          .collection<PlatformConfigDoc>("platform_config")
          .findOne({ id: "settings" }, { projection: { _id: 0 } });
        const requireVer =
          (settingsDoc?.value as PlatformSettings | undefined)
            ?.requireDesignerVerification ?? true;
        if (requireVer) {
          cleanDoc.status = "PENDING";
        }
      } else if (!options.isAdmin && op.collection === "users") {
        cleanDoc.status = "ACTIVE";
      }
      const keyVal = cleanDoc[keyField];
      if (typeof keyVal !== "string" || !keyVal) {
        return {
          ok: false,
          error: `Missing key '${keyField}' for upsert into '${op.collection}'.`,
          status: 400,
        };
      }
      await col.replaceOne(
        { [keyField]: keyVal },
        cleanDoc,
        { upsert: true }
      );
      applied += 1;
    } else if (op.op === "patch") {
      const cleanPatch = sanitizeRecord(op.patch);
      if (Object.keys(cleanPatch).length > 0) {
        await col.updateOne(
          { [keyField]: op.id },
          { $set: cleanPatch }
        );
      }
      applied += 1;
    } else if (op.op === "delete") {
      await col.deleteOne({ [keyField]: op.id });
      applied += 1;
    } else if (op.op === "deleteMany") {
      const filterEntries = Object.entries(op.filter).filter(
        ([k, v]) => ALLOWED_DELETE_MANY_FIELDS.has(k) && typeof v === "string" && v.length > 0
      );
      if (filterEntries.length === 0) {
        return {
          ok: false,
          error: `Invalid deleteMany filter for '${op.collection}'.`,
          status: 400,
        };
      }
      await col.deleteMany(Object.fromEntries(filterEntries));
      applied += 1;
    }
  }

  return { ok: true, applied };
}
