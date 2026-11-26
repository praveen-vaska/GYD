import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        mode: "WEBHOOK_PREP",
        error: "RAZORPAY_WEBHOOK_SECRET is not configured in environment.",
      },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expected) {
    return NextResponse.json(
      { ok: false, error: "Invalid Razorpay webhook signature." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, received: true });
}
