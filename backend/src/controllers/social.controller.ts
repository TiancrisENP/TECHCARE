import { Response } from "express";
import { prisma } from "../config/db";
import { createSocialLinkSchema, updateSocialLinkSchema } from "../validators/social.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";

const MAX_LINKS = 5;

function normalizeUrl(network: string, raw: string) {
  const value = raw.trim();
  if (network === "WHATSAPP") {
    const digits = value.replace(/[^\d]/g, "");
    if (/^\d{8,15}$/.test(digits) && !value.includes("http")) {
      return `https://wa.me/${digits}`;
    }
  }
  if (!/^https?:\/\//i.test(value)) return `https://${value}`;
  return value;
}

export async function listPublicSocialLinks(_req: AuthRequest, res: Response) {
  const links = await prisma.socialLink.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    take: MAX_LINKS,
  });
  res.json(links);
}

export async function listSocialLinks(_req: AuthRequest, res: Response) {
  const links = await prisma.socialLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json(links);
}

export async function createSocialLink(req: AuthRequest, res: Response) {
  const data = createSocialLinkSchema.parse(req.body);
  const count = await prisma.socialLink.count();
  if (count >= MAX_LINKS) {
    throw new ApiError(400, "Solo puedes configurar hasta 5 burbujas de redes o chat.");
  }

  const payload: {
    network: typeof data.network;
    label: string;
    url: string;
    sortOrder: number;
    active: boolean;
    iconUrl?: string | null;
  } = {
    network: data.network,
    label: data.label,
    url: normalizeUrl(data.network, data.url),
    sortOrder: data.sortOrder ?? 0,
    active: data.active ?? true,
  };
  const icon = data.iconUrl?.trim();
  if (icon) payload.iconUrl = icon;

  let link;
  try {
    link = await prisma.socialLink.create({ data: payload });
  } catch (err) {
    if (payload.iconUrl) {
      const { iconUrl: _ignored, ...withoutIcon } = payload;
      link = await prisma.socialLink.create({ data: withoutIcon });
    } else {
      throw err;
    }
  }

  await recordAudit({
    userId: req.user?.sub,
    action: "SOCIAL_LINK_CREATED",
    entity: "SocialLink",
    entityId: link.id,
    details: { network: link.network, url: link.url },
  });

  res.status(201).json(link);
}

export async function updateSocialLink(req: AuthRequest, res: Response) {
  const data = updateSocialLinkSchema.parse(req.body);
  const before = await prisma.socialLink.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Enlace no encontrado.");

  const { iconUrl, url, network, ...rest } = data;
  const link = await prisma.socialLink.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(network ? { network } : {}),
      url: url ? normalizeUrl(network || before.network, url) : undefined,
      ...(iconUrl !== undefined ? { iconUrl: iconUrl?.trim() || null } : {}),
    },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "SOCIAL_LINK_UPDATED",
    entity: "SocialLink",
    entityId: link.id,
  });

  res.json(link);
}

export async function deleteSocialLink(req: AuthRequest, res: Response) {
  const before = await prisma.socialLink.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Enlace no encontrado.");

  await prisma.socialLink.delete({ where: { id: req.params.id } });

  await recordAudit({
    userId: req.user?.sub,
    action: "SOCIAL_LINK_DELETED",
    entity: "SocialLink",
    entityId: req.params.id,
  });

  res.json({ ok: true });
}
