import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "node:fs";
import path from "node:path";
import { adminAuthRouter } from "./routes/admin-auth";
import { authRouter } from "./routes/auth";
import { bookingsRouter } from "./routes/bookings";
import { categoriesRouter } from "./routes/categories";
import { conversationsRouter } from "./routes/conversations";
import { designersRouter } from "./routes/designers";
import { favouritesRouter } from "./routes/favourites";
import { healthRouter } from "./routes/health";
import { marketplaceRouter } from "./routes/marketplace";
import { paymentsRouter } from "./routes/payments";
import { placesRouter } from "./routes/places";
import { usersRouter } from "./routes/users";

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT?.trim() || "4000");

function resolveConfiguredOrigins(): { allowAll: boolean; origins: Set<string> } {
  const raw =
    process.env.CORS_ORIGINS?.trim() ||
    "http://localhost:3000,http://127.0.0.1:3000";
  const entries = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    allowAll: entries.includes("*"),
    origins: new Set(entries),
  };
}

const { allowAll: allowAllOrigins, origins: allowedOrigins } =
  resolveConfiguredOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllOrigins) {
        callback(null, true);
        return;
      }
      if (
        allowedOrigins.has(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Mount webhook route BEFORE global express.json() so raw HMAC verification receives exact bytes.
app.use("/api/payments", paymentsRouter);

app.use(express.json({ limit: "5mb" }));

// Serve static showcase/designer/category assets for Flutter & web clients.
const publicImagesCandidates = [
  path.resolve(__dirname, "..", "public", "images"),
  path.resolve(__dirname, "..", "..", "public", "images"),
  path.resolve(process.cwd(), "public", "images"),
];
const imagesDir = publicImagesCandidates.find((dir) => fs.existsSync(dir));
if (imagesDir) {
  app.use("/images", express.static(imagesDir, { maxAge: "1d" }));
}

app.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "gyd-backend",
    port,
    health: "/api/health",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/designers", designersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/favourites", favouritesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/users", usersRouter);
app.use("/api/places", placesRouter);
app.use("/api/admin", adminAuthRouter);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: "API endpoint not found." });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  if (
    err instanceof SyntaxError &&
    typeof err === "object" &&
    err !== null &&
    "body" in err
  ) {
    res.status(400).json({ ok: false, error: "Invalid JSON payload." });
    return;
  }
  console.error("[gyd-backend unhandled error]", err);
  res.status(500).json({ ok: false, error: "Internal server error." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`GYD Backend API listening on http://0.0.0.0:${port}`);
});
