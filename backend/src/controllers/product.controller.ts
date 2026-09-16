import { Response } from "express";
import { prisma } from "../config/db";
import { createProductSchema, updateProductSchema, stockAdjustmentSchema } from "../validators/product.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";

export async function listProducts(req: AuthRequest, res: Response) {
  const { q, category, onlyActive } = req.query;

  const products = await prisma.product.findMany({
    where: {
      active: onlyActive === "false" ? undefined : true,
      categoryId: category ? String(category) : undefined,
      OR: q
        ? [
            { name: { contains: String(q), mode: "insensitive" } },
            { sku: { contains: String(q), mode: "insensitive" } },
            { brand: { contains: String(q), mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(products);
}

export async function getProduct(req: AuthRequest, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new ApiError(404, "Producto no encontrado.");
  res.json(product);
}

export async function createProduct(req: AuthRequest, res: Response) {
  const data = createProductSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new ApiError(409, "Ya existe un producto con ese SKU.");

  const product = await prisma.product.create({ data });

  await recordAudit({
    userId: req.user?.sub,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    details: { name: product.name, sku: product.sku },
  });

  res.status(201).json(product);
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const data = updateProductSchema.parse(req.body);

  const before = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Producto no encontrado.");

  const product = await prisma.product.update({ where: { id: req.params.id }, data });

  // Auditoría detallada de cambio de stock, como pide el ejemplo del brief
  if (data.stock !== undefined && data.stock !== before.stock) {
    await recordAudit({
      userId: req.user?.sub,
      action: "PRODUCT_STOCK_CHANGED",
      entity: "Product",
      entityId: product.id,
      details: { from: before.stock, to: data.stock, name: product.name },
    });
  } else {
    await recordAudit({
      userId: req.user?.sub,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: product.id,
    });
  }

  res.json(product);
}

export async function deactivateProduct(req: AuthRequest, res: Response) {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "PRODUCT_DEACTIVATED",
    entity: "Product",
    entityId: product.id,
  });

  res.json(product);
}

export async function adjustStock(req: AuthRequest, res: Response) {
  const data = stockAdjustmentSchema.parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new ApiError(404, "Producto no encontrado.");

  const delta = data.type === "SALIDA" ? -Math.abs(data.quantity) : Math.abs(data.quantity);
  const newStock = data.type === "AJUSTE" ? data.quantity : product.stock + delta;

  if (newStock < 0) throw new ApiError(400, "El stock no puede quedar negativo.");

  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { stock: newStock } }),
    prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      },
    }),
  ]);

  await recordAudit({
    userId: req.user?.sub,
    action: "INVENTORY_MOVEMENT",
    entity: "Product",
    entityId: product.id,
    details: { type: data.type, quantity: data.quantity, from: product.stock, to: newStock },
  });

  res.json(updated);
}

export async function listLowStock(_req: AuthRequest, res: Response) {
  const products = await prisma.product.findMany({
    where: { active: true },
  });
  const low = products.filter((p) => p.stock <= p.minStock);
  res.json(low);
}
