import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  buildRestrictionPayload,
  extractBearerToken,
  verifyCustomerToken,
  type StoredUserRecord,
} from "../auth/customer-token";
import { sanitizeText } from "../auth/session";
import { getDb, isMongoConfigured } from "../db/mongodb";
import { ensureSeeded } from "../db/seed";
import type { Conversation, DesignerProfile } from "../types";

export const conversationsRouter = Router();

const enquirySchema = z.object({
  designerId: z.string().min(1),
  message: z
    .string()
    .trim()
    .min(5, "Please include at least a brief note about your occasion.")
    .max(1000),
});

conversationsRouter.post("/enquiry", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      ok: false,
      error: "Sign in to send an enquiry to this studio.",
    });
    return;
  }

  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid enquiry message.",
    });
    return;
  }

  if (!isMongoConfigured()) {
    res.json({
      ok: true,
      mode: "SANDBOX",
      conversationId: `conv-sandbox-${parsed.data.designerId}`,
    });
    return;
  }

  try {
    const db = await getDb();
    await ensureSeeded(db);

    const verified = await verifyCustomerToken(token, "access", db);
    if (!verified.valid) {
      res.status(401).json({ ok: false, code: verified.code, error: "Invalid session." });
      return;
    }

    const [customerUser, designer] = await Promise.all([
      db
        .collection<StoredUserRecord>("users")
        .findOne({ id: verified.claims.sub }, { projection: { _id: 0 } }),
      db
        .collection<DesignerProfile>("designers")
        .findOne({ id: parsed.data.designerId }, { projection: { _id: 0 } }),
    ]);

    if (!customerUser) {
      res.status(401).json({ ok: false, error: "Account not found." });
      return;
    }
    if (customerUser.status !== "ACTIVE") {
      res.status(403).json(buildRestrictionPayload(customerUser.status));
      return;
    }

    const designerOwner = designer
      ? await db
          .collection<StoredUserRecord>("users")
          .findOne({ id: designer.userId }, { projection: { _id: 0 } })
      : null;

    if (
      !designer ||
      designer.approvalStatus === "SUSPENDED" ||
      designer.approvalStatus === "REJECTED" ||
      !designerOwner ||
      designerOwner.status !== "ACTIVE"
    ) {
      res.status(404).json({ ok: false, error: "This designer studio is unavailable." });
      return;
    }

    const convCol = db.collection<Conversation>("conversations");
    const existing = await convCol.findOne(
      { customerId: customerUser.id, designerId: designer.id },
      { projection: { _id: 0 } }
    );

    const nowIso = new Date().toISOString();
    const cleanBody = sanitizeText(parsed.data.message);
    const convId = existing?.id ?? `conv-${Date.now()}`;

    if (existing) {
      await convCol.updateOne(
        { id: convId },
        {
          $set: {
            lastMessagePreview: cleanBody,
            unreadCountDesigner: (existing.unreadCountDesigner ?? 0) + 1,
            updatedAt: nowIso,
          },
        }
      );
    } else {
      await convCol.insertOne({
        id: convId,
        customerId: customerUser.id,
        customerName: customerUser.name,
        customerAvatar: customerUser.avatarUrl,
        designerId: designer.id,
        designerName: designer.name,
        designerAvatar: designer.avatarUrl,
        subject: `Style Enquiry · ${designer.name}`,
        lastMessagePreview: cleanBody,
        unreadCountCustomer: 0,
        unreadCountDesigner: 1,
        updatedAt: nowIso,
      });
    }

    await db.collection("messages").insertOne({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: customerUser.id,
      senderName: customerUser.name,
      senderRole: "CUSTOMER",
      body: cleanBody,
      isRead: false,
      createdAt: nowIso,
    });

    res.status(201).json({
      ok: true,
      conversationId: convId,
    });
  } catch (err) {
    console.error("[conversations/enquiry POST]", err);
    res.status(500).json({ ok: false, error: "Failed to send enquiry." });
  }
});
