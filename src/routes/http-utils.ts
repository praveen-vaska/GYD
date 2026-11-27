import type { Request } from "express";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "../auth/admin-token";

export function getQueryString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export async function verifyAdminRequest(
  req: Request
): Promise<{ valid: boolean; email?: string }> {
  const cookies = (req as Request & { cookies?: Record<string, string> })
    .cookies;
  const token = cookies?.[ADMIN_SESSION_COOKIE];
  return verifyAdminSessionToken(token);
}
