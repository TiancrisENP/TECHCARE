import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";

const REFRESH_COOKIE = "techcare_refresh";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: "/api/auth",
  };
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "Ya existe una cuenta con este email.");

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: "CLIENTE", // los clientes siempre se autoregistran con este rol
    },
  });

  await recordAudit({ userId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id });

  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.active) throw new ApiError(401, "Credenciales inválidas.");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Credenciales inválidas.");

  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, "No hay sesión activa.");

  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.active) throw new ApiError(401, "Sesión inválida.");

    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    res.json({ accessToken });
  } catch {
    throw new ApiError(401, "Sesión expirada, inicia sesión nuevamente.");
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ message: "Sesión cerrada." });
}

export async function me(req: Request, res: Response) {
  const authReq = req as any;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user.sub },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, "Usuario no encontrado.");
  res.json(user);
}
