import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getConfiguredAdminCredentials,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-token";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = await verifyAdminSessionToken(token);
  const isSilentCheck = request.nextUrl.searchParams.get("check") === "1";
  if (!verified.valid || !verified.email) {
    return NextResponse.json(
      { authenticated: false },
      { status: isSilentCheck ? 200 : 401 }
    );
  }
  return NextResponse.json({
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
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const creds = getConfiguredAdminCredentials();

  const emailMatches = creds.emails.includes(email);
  const passwordMatches = password === creds.password;

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json(
      { ok: false, error: "Invalid administrator email or password." },
      { status: 401 }
    );
  }

  const token = await createAdminSessionToken(email);
  const response = NextResponse.json({
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

  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps,
    maxAge: 60 * 60 * 12,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
