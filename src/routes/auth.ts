import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  buildRestrictionPayload,
  createCustomerTokenPair,
  extractBearerToken,
  hashPassword,
  revokeToken,
  sanitizeUser,
  verifyCustomerToken,
  verifyPassword,
  type StoredUserRecord,
} from "../auth/customer-token";
import { sanitizeText } from "../auth/session";
import { SEED_CUSTOMERS, SEED_USERS } from "../data/seed-data";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import type { CustomerProfile } from "../types";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(100),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(10, "Enter a valid mobile number.").max(30),
  city: z.string().trim().min(2, "City is required.").max(80).default("Hyderabad"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  expectedRole: z.enum(["CUSTOMER", "DESIGNER"]).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const resetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(128),
});

async function loadUserAndCustomer(
  filter: { email: string } | { id: string }
): Promise<{
  userRecord: StoredUserRecord | null;
  customerProfile: CustomerProfile | null;
}> {
  if (isMongoConfigured()) {
    const db = await getDb();
    await ensureSeeded(db);
    const userRecord = await db
      .collection<StoredUserRecord>("users")
      .findOne(filter, { projection: { _id: 0 } });
    const customerProfile = userRecord
      ? await db
          .collection<CustomerProfile>("customers")
          .findOne({ userId: userRecord.id }, { projection: { _id: 0 } })
      : null;
    return { userRecord, customerProfile };
  }

  const userRecord =
    "email" in filter
      ? SEED_USERS.find((u) => u.email.toLowerCase() === filter.email) ?? null
      : SEED_USERS.find((u) => u.id === filter.id) ?? null;
  const customerProfile = userRecord
    ? SEED_CUSTOMERS.find((c) => c.userId === userRecord.id) ?? null
    : null;
  return { userRecord, customerProfile };
}

authRouter.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
      issues: parsed.error.flatten(),
    });
    return;
  }

  if (!isMongoConfigured()) {
    res.status(503).json({
      ok: false,
      error: "Database is not configured. Configure MONGODB_URI in .env.",
    });
    return;
  }

  try {
    const db = await getDb();
    await ensureSeeded(db);

    const email = parsed.data.email.toLowerCase();
    const usersCol = db.collection<StoredUserRecord>("users");
    const existing = await usersCol.findOne(
      { email },
      { projection: { _id: 0, id: 1 } }
    );
    if (existing) {
      res.status(409).json({
        ok: false,
        error: "An account with this email already exists.",
      });
      return;
    }

    const now = new Date().toISOString();
    const userId = `usr-cust-${Date.now()}`;
    const userRecord: StoredUserRecord = {
      id: userId,
      name: sanitizeText(parsed.data.name),
      email,
      phone: sanitizeText(parsed.data.phone),
      city: sanitizeText(parsed.data.city),
      role: "CUSTOMER",
      status: "ACTIVE",
      avatarUrl: "/images/designers/designer-06.jpg",
      createdAt: now,
      passwordHash: hashPassword(parsed.data.password),
    };

    const customerProfile: CustomerProfile = {
      id: `cust-${Date.now()}`,
      userId,
      preferredStyleTags: ["Personal Curation"],
      defaultCity: userRecord.city,
      savedAddresses: [],
      totalBookings: 0,
    };

    await Promise.all([
      usersCol.insertOne(userRecord),
      db.collection<CustomerProfile>("customers").insertOne(customerProfile),
    ]);

    const tokens = createCustomerTokenPair({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
    });

    res.status(201).json({
      ok: true,
      ...tokens,
      user: sanitizeUser(userRecord),
      customerProfile,
    });
  } catch (err) {
    console.error("[auth/register POST]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to register customer account.",
    });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid sign-in details.",
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  let userRecord: StoredUserRecord | null = null;
  let customerProfile: CustomerProfile | null = null;

  try {
    const loaded = await loadUserAndCustomer({ email });
    userRecord = loaded.userRecord;
    customerProfile = loaded.customerProfile;
  } catch (err) {
    console.error("[auth/login POST]", err);
    res.status(500).json({
      ok: false,
      error: "Unable to verify credentials right now.",
    });
    return;
  }

  if (!userRecord) {
    res.status(401).json({
      ok: false,
      error: "Invalid email or password.",
    });
    return;
  }

  if (userRecord.role === "ADMIN") {
    res.status(403).json({
      ok: false,
      code: "ROLE_NOT_ALLOWED",
      error:
        "Administrator sign-in is restricted to authorized personnel via the Admin web portal.",
    });
    return;
  }

  if (
    parsed.data.expectedRole &&
    userRecord.role !== parsed.data.expectedRole
  ) {
    res.status(403).json({
      ok: false,
      code: "ROLE_NOT_ALLOWED",
      error:
        "This application is exclusively for GYD Customer accounts. Please sign in with a customer profile.",
    });
    return;
  }

  if (!verifyPassword(parsed.data.password, userRecord.passwordHash, email)) {
    res.status(401).json({
      ok: false,
      error: "Invalid email or password.",
    });
    return;
  }

  if (userRecord.status !== "ACTIVE") {
    res.status(403).json(buildRestrictionPayload(userRecord.status));
    return;
  }

  const tokens = createCustomerTokenPair({
    id: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
  });

  res.json({
    ok: true,
    ...tokens,
    user: sanitizeUser(userRecord),
    customerProfile,
  });
});

authRouter.get("/me", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      ok: false,
      code: "TOKEN_MISSING",
      error: "Authentication required.",
    });
    return;
  }

  try {
    const db = isMongoConfigured() ? await getDb() : null;
    if (db) {
      await ensureSeeded(db);
    }

    const verified = await verifyCustomerToken(token, "access", db);
    if (!verified.valid) {
      res.status(401).json({
        ok: false,
        code: verified.code,
        error:
          verified.code === "TOKEN_EXPIRED"
            ? "Session expired. Refresh required."
            : "Invalid or revoked session.",
      });
      return;
    }

    const { userRecord, customerProfile } = await loadUserAndCustomer({
      id: verified.claims.sub,
    });

    if (!userRecord) {
      res.status(401).json({
        ok: false,
        code: "ACCOUNT_NOT_FOUND",
        error: "Account not found.",
      });
      return;
    }

    if (userRecord.status !== "ACTIVE") {
      res.status(403).json(buildRestrictionPayload(userRecord.status));
      return;
    }

    res.json({
      ok: true,
      user: sanitizeUser(userRecord),
      customerProfile,
    });
  } catch (err) {
    console.error("[auth/me GET]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to verify session.",
    });
  }
});

authRouter.post("/refresh", async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "Refresh token is required.",
    });
    return;
  }

  try {
    const db = isMongoConfigured() ? await getDb() : null;
    if (db) {
      await ensureSeeded(db);
    }

    const verified = await verifyCustomerToken(
      parsed.data.refreshToken,
      "refresh",
      db
    );
    if (!verified.valid) {
      res.status(401).json({
        ok: false,
        code: verified.code,
        error: "Refresh session invalid or expired. Please sign in again.",
      });
      return;
    }

    const { userRecord, customerProfile } = await loadUserAndCustomer({
      id: verified.claims.sub,
    });

    if (!userRecord) {
      res.status(401).json({
        ok: false,
        code: "ACCOUNT_NOT_FOUND",
        error: "Account not found.",
      });
      return;
    }

    if (userRecord.status !== "ACTIVE") {
      await revokeToken(parsed.data.refreshToken, db);
      res.status(403).json(buildRestrictionPayload(userRecord.status));
      return;
    }

    await revokeToken(parsed.data.refreshToken, db);

    const tokens = createCustomerTokenPair({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
    });

    res.json({
      ok: true,
      ...tokens,
      user: sanitizeUser(userRecord),
      customerProfile,
    });
  } catch (err) {
    console.error("[auth/refresh POST]", err);
    res.status(500).json({
      ok: false,
      error: "Failed to refresh authentication session.",
    });
  }
});

authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom =
    process.env.EMAIL_FROM?.trim() ||
    "GYD Concierge <concierge@getyourdesigner.in>";

  if (!isMongoConfigured()) {
    res.json({
      ok: true,
      mode: "SANDBOX_PREP",
      message:
        "Password recovery is in sandbox preview mode because MongoDB Atlas is not configured.",
      expiresInMinutes: 15,
    });
    return;
  }

  try {
    const db = await getDb();
    await ensureSeeded(db);

    const user = await db
      .collection<StoredUserRecord>("users")
      .findOne(
        { email },
        { projection: { _id: 0, id: 1, name: 1, status: 1, role: 1 } }
      );

    if (!user || user.role === "ADMIN") {
      res.json({
        ok: true,
        mode: resendKey ? "RESEND" : "SANDBOX_PREP",
        message:
          "If an active account exists for this email, recovery instructions have been prepared.",
        expiresInMinutes: 15,
      });
      return;
    }

    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.collection("password_resets").insertOne({
      id: `rst-${Date.now()}`,
      userId: user.id,
      email,
      codeHash,
      used: false,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    if (resendKey && !resendKey.startsWith("re_xxxx")) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: "GYD Password Recovery Code",
          html: `<p>Hi ${user.name},</p><p>Your GYD verification code is <strong>${code}</strong>. It expires in 15 minutes.</p>`,
        }),
      });
      res.json({
        ok: true,
        mode: "RESEND",
        message: `A 6-digit recovery code has been sent to ${email}.`,
        expiresInMinutes: 15,
      });
      return;
    }

    const isProd = process.env.NODE_ENV === "production";
    res.json({
      ok: true,
      mode: "SANDBOX_PREP",
      message:
        "Email delivery via Resend is not configured. Use the sandbox recovery code below to complete password reset testing.",
      expiresInMinutes: 15,
      ...(isProd ? {} : { sandboxResetCode: code }),
    });
  } catch (err) {
    console.error("[auth/forgot-password POST]", err);
    res.status(500).json({
      ok: false,
      error: "Unable to prepare password recovery right now.",
    });
  }
});

authRouter.post("/reset-password", async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid reset request.",
    });
    return;
  }

  if (!isMongoConfigured()) {
    res.status(503).json({
      ok: false,
      error: "Database is not configured. Configure MONGODB_URI in .env.",
    });
    return;
  }

  try {
    const db = await getDb();
    await ensureSeeded(db);

    const email = parsed.data.email.toLowerCase();
    const user = await db
      .collection<StoredUserRecord>("users")
      .findOne({ email }, { projection: { _id: 0 } });

    if (!user || user.role === "ADMIN") {
      res.status(400).json({
        ok: false,
        error: "Invalid or expired recovery code.",
      });
      return;
    }

    if (user.status !== "ACTIVE") {
      res.status(403).json(buildRestrictionPayload(user.status));
      return;
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(parsed.data.code)
      .digest("hex");

    const resetCol = db.collection("password_resets");
    const resetDoc = await resetCol.findOne(
      {
        email,
        codeHash,
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { sort: { createdAt: -1 } }
    );

    if (!resetDoc) {
      res.status(400).json({
        ok: false,
        error: "Invalid or expired 6-digit verification code.",
      });
      return;
    }

    await Promise.all([
      db.collection("users").updateOne(
        { id: user.id },
        {
          $set: {
            passwordHash: hashPassword(parsed.data.newPassword),
            updatedAt: new Date().toISOString(),
          },
        }
      ),
      resetCol.updateOne(
        { id: resetDoc.id as string },
        { $set: { used: true, usedAt: new Date().toISOString() } }
      ),
    ]);

    res.json({
      ok: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[auth/reset-password POST]", err);
    res.status(500).json({
      ok: false,
      error: "Unable to reset password right now.",
    });
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const accessToken = extractBearerToken(req);
    const body = (req.body ?? {}) as { refreshToken?: string };
    const refreshToken =
      typeof body?.refreshToken === "string" ? body.refreshToken : undefined;

    const db = isMongoConfigured() ? await getDb() : null;
    await Promise.all([
      revokeToken(accessToken, db),
      revokeToken(refreshToken, db),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("[auth/logout POST]", err);
    res.json({ ok: true });
  }
});
