import { Router, type Request, type Response } from "express";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getConfiguredAdminCredentials,
} from "../auth/admin-token";
import { getQueryString, verifyAdminRequest } from "./http-utils";

export const adminAuthRouter = Router();

adminAuthRouter.get("/auth", async (req: Request, res: Response) => {
  const verified = await verifyAdminRequest(req);
  const isSilentCheck = getQueryString(req.query.check) === "1";
  if (!verified.valid || !verified.email) {
    res.status(isSilentCheck ? 200 : 401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    session: {
      userId: "usr-admin-1",
      name: "Siddharth Rao",
      email: verified.email,
      role: "ADMIN",
      city: "Bengaluru",
      isDemoSession: false,
    },
  });
});

adminAuthRouter.post("/auth", async (req: Request, res: Response) => {
  const body = req.body as { email?: string; password?: string } | undefined;
  if (!body || typeof body !== "object") {
    res.status(400).json({ ok: false, error: "Invalid request payload." });
    return;
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const creds = getConfiguredAdminCredentials();

  const emailMatches = creds.emails.includes(email);
  const passwordMatches = password === creds.password;

  if (!emailMatches || !passwordMatches) {
    res.status(401).json({
      ok: false,
      error: "Invalid administrator email or password.",
    });
    return;
  }

  const token = await createAdminSessionToken(email);
  const isHttps =
    req.protocol === "https" ||
    req.get("x-forwarded-proto") === "https";

  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps,
    maxAge: 1000 * 60 * 60 * 12,
  });

  res.json({
    ok: true,
    session: {
      userId: "usr-admin-1",
      name: "Siddharth Rao",
      email,
      role: "ADMIN",
      city: "Bengaluru",
      isDemoSession: false,
    },
  });
});

adminAuthRouter.delete("/auth", (_req: Request, res: Response) => {
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  res.json({ ok: true });
});
