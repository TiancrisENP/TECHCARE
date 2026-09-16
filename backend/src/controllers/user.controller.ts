import { Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { createClienteSchema, createUserSchema } from "../validators/user.validator";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "VENDEDOR", "TECNICO", "CLIENTE"]),
});

const assignableSelect = { id: true, name: true, email: true, role: true, active: true, phone: true } as const;

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
}

/** Staff: usuarios activos a los que se puede asignar una venta, servicio o garantía. */
export async function listAssignableUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: assignableSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  res.json(users);
}

export async function createUser(req: AuthRequest, res: Response) {
  const data = createUserSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "Ya existe una cuenta con este email.");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
    },
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, createdAt: true },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    details: { role: user.role, email: user.email },
  });

  res.status(201).json(user);
}

/** Técnico/vendedor/admin: crea solo cuentas CLIENTE (el cliente atendido en tienda). */
export async function createCliente(req: AuthRequest, res: Response) {
  const data = createClienteSchema.parse(req.body);
  const email = data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Ya existe una cuenta con este email.");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      phone: data.phone?.trim() || undefined,
      role: "CLIENTE",
    },
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, createdAt: true },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "CLIENTE_CREATED",
    entity: "User",
    entityId: user.id,
    details: { email: user.email, createdByRole: req.user?.role },
  });

  res.status(201).json(user);
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  const data = updateRoleSchema.parse(req.body);
  const before = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Usuario no encontrado.");

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: data.role },
    select: { id: true, name: true, email: true, role: true },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "USER_ROLE_CHANGED",
    entity: "User",
    entityId: user.id,
    details: { from: before.role, to: data.role },
  });

  res.json(user);
}

export async function toggleUserActive(req: AuthRequest, res: Response) {
  const before = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Usuario no encontrado.");

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { active: !before.active },
    select: { id: true, active: true },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: user.active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    entity: "User",
    entityId: user.id,
  });

  res.json(user);
}
