import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";
import { uploadBuffer } from "../utils/cloudinary";
import { recordAudit } from "../utils/audit";

export async function uploadImages(req: AuthRequest, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw new ApiError(400, "Adjunta al menos una fotografía.");
  }

  const folder = String(req.body.folder || "techcare");
  const uploads = [];
  for (const file of files) {
    const stored = await uploadBuffer(file.buffer, folder);
    uploads.push({ url: stored.url, publicId: stored.publicId });
  }

  await recordAudit({
    userId: req.user?.sub,
    action: "IMAGES_UPLOADED",
    entity: "Cloudinary",
    details: { count: uploads.length, folder },
  });

  res.status(201).json({ urls: uploads.map((u) => u.url), files: uploads });
}
