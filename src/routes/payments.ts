import crypto from "node:crypto";
import express, { Router, type Request, type Response } from "express";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/razorpay/webhook",
  express.raw({ type: "*/*", limit: "1mb" }),
  (req: Request, res: Response) => {
    const signature = req.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      res.status(503).json({
        ok: false,
        mode: "WEBHOOK_PREP",
        error: "RAZORPAY_WEBHOOK_SECRET is not configured in environment.",
      });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : "";

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expected) {
      res.status(401).json({
        ok: false,
        error: "Invalid Razorpay webhook signature.",
      });
      return;
    }

    res.json({ ok: true, received: true });
  }
);
