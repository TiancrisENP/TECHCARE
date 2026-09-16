import { z } from "zod";

export const socialNetworkSchema = z.enum([
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "TELEGRAM",
  "OTRO",
]);

export const createSocialLinkSchema = z.object({
  network: socialNetworkSchema,
  label: z.string().min(2).max(40),
  url: z.string().min(5),
  iconUrl: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim();
      if (!trimmed || trimmed.includes("…") || trimmed.includes("...")) return null;
      return trimmed;
    }),
  sortOrder: z.number().int().min(0).max(20).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();
