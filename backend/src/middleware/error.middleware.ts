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

  if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "La imagen supera 5 MB." });
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
    return res.status(400).json({
      message: "No se pudo guardar el enlace. Revisa los datos o reinicia el API.",
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Error interno del servidor." });
}
