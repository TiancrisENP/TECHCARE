import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Error de validación.",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2022") {
      return res.status(500).json({
        message: "La base de datos no está al día. En backend ejecuta: npx prisma migrate deploy",
      });
    }
    return res.status(400).json({ message: `No se pudo guardar (${err.code}).` });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation:", err.message);
    const missingDirect = /directUrl|DIRECT_URL|direct URL/i.test(err.message);
    return res.status(500).json({
      message: missingDirect
        ? "Falta DIRECT_URL en Render (usa la URL de Supabase del puerto 5432, sin comillas)."
        : "Error de Prisma al consultar la base de datos. Revisa DATABASE_URL y DIRECT_URL en Render (sin comillas).",
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Error interno del servidor." });
}
