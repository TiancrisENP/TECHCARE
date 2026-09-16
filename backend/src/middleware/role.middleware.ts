import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "./auth.middleware";

/**
 * Restringe el acceso a una ruta según el rol del usuario autenticado.
 * Uso: router.get("/", requireAuth, requireRole("ADMIN", "VENDEDOR"), handler)
 */
export function requireRole(...allowed: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado." });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${allowed.join(" o ")}.`,
      });
    }

    next();
  };
}

/**
 * Matriz de permisos de referencia (documentación viva del RBAC descrito
 * en el proyecto: Admin todo, Vendedor/Técnico/Cliente con accesos parciales).
 * Los middlewares de cada ruta son la fuente de verdad; esto es solo guía.
 */
export const PERMISSIONS_MATRIX = {
  ADMIN: ["*"],
  VENDEDOR: ["products:write", "orders:write", "customers:write", "inventory:read", "services:read"],
  TECNICO: ["services:write", "customers:read", "warranties:read", "inventory:read"],
  CLIENTE: ["products:read", "orders:own", "services:own", "warranties:own"],
} as const;
