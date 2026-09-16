import { Response } from "express";
import { prisma } from "../config/db";
import { createWarrantySchema, updateWarrantyStatusSchema } from "../validators/warranty.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { resolveCustomerId } from "../utils/customer";

export async function listWarranties(req: AuthRequest, res: Response) {
  const { role, sub } = req.user!;
  const warranties = await prisma.warranty.findMany({
    where: role === "CLIENTE" ? { customerId: sub } : {},
    include: { product: true, customer: true, evidence: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(warranties);
}

export async function getWarranty(req: AuthRequest, res: Response) {
  const warranty = await prisma.warranty.findUnique({
    where: { id: req.params.id },
    include: { product: true, evidence: true },
  });
  if (!warranty) throw new ApiError(404, "Garantía no encontrada.");
  if (req.user!.role === "CLIENTE" && warranty.customerId !== req.user!.sub) {
    throw new ApiError(403, "No autorizado.");
  }
  res.json(warranty);
}

export async function createWarranty(req: AuthRequest, res: Response) {
  const data = createWarrantySchema.parse(req.body);
  const customerId = await resolveCustomerId(req, data.customerId);

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new ApiError(400, "El producto seleccionado no existe.");

  if (data.orderId) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new ApiError(400, "El pedido asociado no existe.");
    if (order.customerId !== customerId) {
      throw new ApiError(400, "El pedido no pertenece al usuario seleccionado.");
    }
  }

  const warranty = await prisma.warranty.create({
    data: {
      productId: data.productId,
      orderId: data.orderId,
      customerId,
      problem: data.problem,
      purchaseDate: new Date(data.purchaseDate),
      evidence: data.evidenceUrls
        ? { create: data.evidenceUrls.map((url) => ({ imageUrl: url })) }
        : undefined,
    },
    include: { evidence: true, product: true, customer: true },
  });

  await recordAudit({
    userId: req.user!.sub,
    action: "WARRANTY_CREATED",
    entity: "Warranty",
    entityId: warranty.id,
  });

  res.status(201).json(warranty);
}

export async function updateWarrantyStatus(req: AuthRequest, res: Response) {
  const data = updateWarrantyStatusSchema.parse(req.body);
  const before = await prisma.warranty.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Garantía no encontrada.");

  const warranty = await prisma.warranty.update({
    where: { id: req.params.id },
    data: { status: data.status },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "WARRANTY_STATUS_CHANGED",
    entity: "Warranty",
    entityId: warranty.id,
    details: { from: before.status, to: data.status },
  });

  res.json(warranty);
}
