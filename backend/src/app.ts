import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes";
import { patchExpressAsyncErrors } from "./middleware/asyncHandler";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

patchExpressAsyncErrors();

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://techcare-tawny.vercel.app",
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;
  try {
    const host = new URL(normalized).hostname;
    return host === "techcare-tawny.vercel.app" || host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
