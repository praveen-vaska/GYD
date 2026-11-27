/**
 * Typed MongoDB collection accessors & collection key metadata for GYD.
 */
import type { Collection, Db, Sort } from "mongodb";
import { getDb } from "./mongodb";
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

export const ENTITY_COLLECTIONS = [
  "users",
  "customers",
  "addresses",
  "categories",
  "designers",
  "services",
  "portfolios",
  "availability",
  "verifications",
  "bookings",
  "payments",
  "refunds",
  "commissions",
  "payouts",
  "reviews",
  "conversations",
  "messages",
  "notifications",
  "favourites",
  "coupons",
  "audit_logs",
] as const;

export type EntityCollectionName = (typeof ENTITY_COLLECTIONS)[number];

export interface PlatformConfigDoc {
  id: "settings" | "cms";
  value: PlatformSettings | CmsContent;
  updatedAt: string;
}

export function getEntityKeyField(collection: EntityCollectionName): string {
  return collection === "availability" ? "designerId" : "id";
}

export async function getCollectionDocs<T>(
  db: Db,
  name: EntityCollectionName,
  sort?: Sort
): Promise<T[]> {
  const projection =
    name === "users" ? { _id: 0, passwordHash: 0 } : { _id: 0 };
  const cursor = db.collection(name).find({}, { projection });
  if (sort) {
    cursor.sort(sort);
  }
  const docs = await cursor.toArray();
  return docs as unknown as T[];
}

export async function usersCol(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>("users");
}

export async function customersCol(): Promise<Collection<CustomerProfile>> {
  const db = await getDb();
  return db.collection<CustomerProfile>("customers");
}

export async function addressesCol(): Promise<Collection<Address>> {
  const db = await getDb();
  return db.collection<Address>("addresses");
}

export async function categoriesCol(): Promise<Collection<Category>> {
  const db = await getDb();
  return db.collection<Category>("categories");
}

export async function designersCol(): Promise<Collection<DesignerProfile>> {
  const db = await getDb();
  return db.collection<DesignerProfile>("designers");
}

export async function servicesCol(): Promise<Collection<Service>> {
  const db = await getDb();
  return db.collection<Service>("services");
}

export async function portfoliosCol(): Promise<Collection<Portfolio>> {
  const db = await getDb();
  return db.collection<Portfolio>("portfolios");
}

export async function availabilityCol(): Promise<Collection<AvailabilitySchedule>> {
  const db = await getDb();
  return db.collection<AvailabilitySchedule>("availability");
}

export async function verificationsCol(): Promise<Collection<DesignerVerification>> {
  const db = await getDb();
  return db.collection<DesignerVerification>("verifications");
}

export async function bookingsCol(): Promise<Collection<Booking>> {
  const db = await getDb();
  return db.collection<Booking>("bookings");
}

export async function paymentsCol(): Promise<Collection<Payment>> {
  const db = await getDb();
  return db.collection<Payment>("payments");
}

export async function refundsCol(): Promise<Collection<Refund>> {
  const db = await getDb();
  return db.collection<Refund>("refunds");
}

export async function commissionsCol(): Promise<Collection<Commission>> {
  const db = await getDb();
  return db.collection<Commission>("commissions");
}

export async function payoutsCol(): Promise<Collection<Payout>> {
  const db = await getDb();
  return db.collection<Payout>("payouts");
}

export async function reviewsCol(): Promise<Collection<Review>> {
  const db = await getDb();
  return db.collection<Review>("reviews");
}

export async function conversationsCol(): Promise<Collection<Conversation>> {
  const db = await getDb();
  return db.collection<Conversation>("conversations");
}

export async function messagesCol(): Promise<Collection<Message>> {
  const db = await getDb();
  return db.collection<Message>("messages");
}

export async function notificationsCol(): Promise<Collection<NotificationItem>> {
  const db = await getDb();
  return db.collection<NotificationItem>("notifications");
}

export async function favouritesCol(): Promise<Collection<Favourite>> {
  const db = await getDb();
  return db.collection<Favourite>("favourites");
}

export async function couponsCol(): Promise<Collection<Coupon>> {
  const db = await getDb();
  return db.collection<Coupon>("coupons");
}

export async function auditLogsCol(): Promise<Collection<AdminAuditLog>> {
  const db = await getDb();
  return db.collection<AdminAuditLog>("audit_logs");
}

export async function platformConfigCol(): Promise<Collection<PlatformConfigDoc>> {
  const db = await getDb();
  return db.collection<PlatformConfigDoc>("platform_config");
}
