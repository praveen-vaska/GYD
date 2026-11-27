import crypto from "node:crypto";
import type { Request } from "express";
import type { Db } from "mongodb";
import { DEMO_ACCOUNTS, GYD_BRAND } from "../constants/gyd";
import type { AccountStatus, User, UserRole } from "../types";

const DEFAULT_SECRET = "gyd-customer-session-secret-change-in-prod-2026";
const ACCESS_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEMO_PASSCODE = "GydDemo@2026";

export interface StoredUserRecord extends User {
  passwordHash?: string;
}

export interface CustomerTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
  typ: "access" | "refresh";
  jti: string;
  iat: number;
  exp: number;
}

function getSigningSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.GYD_AUTH_SECRET?.trim() ||
    DEFAULT_SECRET
  );
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(
  password: string,
  storedHash: string | undefined,
  email: string
): boolean {
  if (storedHash && storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    const derivedHex = crypto.scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqualStr(derivedHex, expectedHex);
  }

  // Compatibility with seeded demo accounts whose seed records omit passwordHash
  const normalized = email.trim().toLowerCase();
  const isDemo = DEMO_ACCOUNTS.some(
    (acc) => acc.email.toLowerCase() === normalized
  );
  if (isDemo) {
    return timingSafeEqualStr(password, DEMO_PASSCODE);
  }

  // Non-demo seed customer accounts in local/seed preview accept >= 6 char fallback
  // only if no passwordHash exists yet (matching gyd-store.tsx web demo behavior).
  return !storedHash && password.length >= 6;
}

function signToken(claims: CustomerTokenClaims): string {
  const encoded = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function createCustomerTokenPair(user: {
  id: string;
  email: string;
  role: UserRole;
}): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const nowSec = Math.floor(Date.now() / 1000);
  const accessToken = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    typ: "access",
    jti: crypto.randomUUID(),
    iat: nowSec,
    exp: nowSec + ACCESS_TTL_SECONDS,
  });
  const refreshToken = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    typ: "refresh",
    jti: crypto.randomUUID(),
    iat: nowSec,
    exp: nowSec + REFRESH_TTL_SECONDS,
  });
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

export async function verifyCustomerToken(
  token: string | undefined | null,
  expectedType: "access" | "refresh",
  db?: Db | null
): Promise<
  | { valid: true; claims: CustomerTokenClaims }
  | { valid: false; code: "TOKEN_MISSING" | "TOKEN_EXPIRED" | "TOKEN_INVALID" | "TOKEN_REVOKED" }
> {
  if (!token) return { valid: false, code: "TOKEN_MISSING" };
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return { valid: false, code: "TOKEN_INVALID" };

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");

  if (!timingSafeEqualStr(sig, expectedSig)) {
    return { valid: false, code: "TOKEN_INVALID" };
  }

  let claims: CustomerTokenClaims;
  try {
    claims = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as CustomerTokenClaims;
  } catch {
    return { valid: false, code: "TOKEN_INVALID" };
  }

  if (
    !claims?.sub ||
    !claims?.jti ||
    claims.typ !== expectedType ||
    typeof claims.exp !== "number"
  ) {
    return { valid: false, code: "TOKEN_INVALID" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec >= claims.exp) {
    return { valid: false, code: "TOKEN_EXPIRED" };
  }

  if (db) {
    const revoked = await db
      .collection("revoked_tokens")
      .findOne({ jti: claims.jti }, { projection: { _id: 0, jti: 1 } });
    if (revoked) {
      return { valid: false, code: "TOKEN_REVOKED" };
    }
  }

  return { valid: true, claims };
}

export async function revokeToken(
  token: string | undefined | null,
  db: Db | null
): Promise<void> {
  if (!token || !db) return;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return;
  const encoded = token.slice(0, dotIdx);
  try {
    const claims = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as Partial<CustomerTokenClaims>;
    if (!claims.jti || !claims.exp) return;
    await db.collection("revoked_tokens").updateOne(
      { jti: claims.jti },
      {
        $set: {
          jti: claims.jti,
          sub: claims.sub ?? null,
          revokedAt: new Date().toISOString(),
          expiresAt: new Date(claims.exp * 1000),
        },
      },
      { upsert: true }
    );
  } catch {
    // ignore malformed token during logout
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || Array.isArray(authHeader)) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}

export function sanitizeUser(record: StoredUserRecord): User {
  const { passwordHash: _ignored, ...rest } = record;
  void _ignored;
  return {
    id: rest.id,
    name: rest.name,
    email: rest.email,
    phone: rest.phone ?? "",
    role: rest.role,
    status: rest.status,
    avatarUrl: rest.avatarUrl || "/images/designers/designer-06.jpg",
    city: rest.city || "Hyderabad",
    createdAt: rest.createdAt,
  };
}

export function buildRestrictionPayload(status: AccountStatus): {
  ok: false;
  code: "ACCOUNT_RESTRICTED";
  status: AccountStatus;
  error: string;
  supportEmail: string;
  supportPhone: string;
} {
  const reason =
    status === "SUSPENDED"
      ? "Your GYD account has been suspended by an administrator. Protected actions are disabled."
      : "Your GYD account is currently inactive. Please contact GYD Concierge to reactivate access.";
  return {
    ok: false,
    code: "ACCOUNT_RESTRICTED",
    status,
    error: reason,
    supportEmail: GYD_BRAND.supportEmail,
    supportPhone: GYD_BRAND.supportPhone,
  };
}
