import { PrismaClient } from "@prisma/client";

function sanitizeEnvUrl(value?: string) {
  if (!value) return value;
  let v = value.trim();
  v = v.replace(/^(DATABASE_URL|DIRECT_URL)\s*=\s*/i, "");
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

process.env.DATABASE_URL = sanitizeEnvUrl(process.env.DATABASE_URL);
process.env.DIRECT_URL = sanitizeEnvUrl(process.env.DIRECT_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en las variables de entorno de Render.");
}
if (!process.env.DIRECT_URL) {
  throw new Error(
    "Falta DIRECT_URL. En Render agrégala (connection string de Supabase puerto 5432). El schema de Prisma la exige."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
