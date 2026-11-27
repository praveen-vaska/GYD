const DEFAULT_SECRET = "gyd-admin-session-secret-change-in-prod-2026";
export const ADMIN_SESSION_COOKIE = "gyd_admin_session";

function getSigningSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

export function getConfiguredAdminCredentials(): {
  emails: string[];
  password: string;
} {
  const envEmail = process.env.GYD_ADMIN_EMAIL?.trim().toLowerCase();
  const emails = envEmail
    ? [envEmail]
    : ["admin@getyourdesigner.in", "admin.demo@gyd.in"];
  const password = process.env.GYD_ADMIN_PASSWORD || "GydAdmin@2026";
  return { emails, password };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function computeHmacHex(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

export async function createAdminSessionToken(email: string): Promise<string> {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const data = `${email}|${exp}`;
  const sig = await computeHmacHex(data);
  const encoded = Buffer.from(data, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<{ valid: boolean; email?: string }> {
  if (!token) return { valid: false };
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return { valid: false };
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  let data: string;
  try {
    data = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }
  const expectedSig = await computeHmacHex(data);
  if (!timingSafeStringEqual(sig, expectedSig)) {
    return { valid: false };
  }
  const [email, expStr] = data.split("|");
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp) || Date.now() > exp) {
    return { valid: false };
  }
  return { valid: true, email };
}
