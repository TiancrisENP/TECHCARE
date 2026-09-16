import { Response } from "express";
import { prisma } from "../config/db";
import { createProductSchema, updateProductSchema, stockAdjustmentSchema } from "../validators/product.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { serializeProduct } from "../utils/product";

function catalogInclude(allVariants: boolean) {
  return {
    images: { orderBy: { sortOrder: "asc" as const } },
    variants: {
      ...(allVariants ? {} : { where: { active: true } }),
      orderBy: { name: "asc" as const },
    },
  };
}

export async function listProducts(req: AuthRequest, res: Response) {
  const { q, category, onlyActive } = req.query;
  const showInactive = onlyActive === "false";

  const products = await prisma.product.findMany({
    where: {
      active: showInactive ? undefined : true,
      categoryId: category ? String(category) : undefined,
      OR: q
        ? [
            { name: { contains: String(q), mode: "insensitive" } },
            { sku: { contains: String(q), mode: "insensitive" } },
            { brand: { contains: String(q), mode: "insensitive" } },
          ]
        : undefined,
    },
    include: catalogInclude(showInactive),
    orderBy: { createdAt: "desc" },
  });

  res.json(products.map(serializeProduct));
}

export async function getProduct(req: AuthRequest, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: catalogInclude(true),
  });
  if (!product) throw new ApiError(404, "Producto no encontrado.");
  res.json(serializeProduct(product));
}

export async function createProduct(req: AuthRequest, res: Response) {
  const data = createProductSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new ApiError(409, "Ya existe un producto con ese ID / SKU.");

  const images = (data.images ?? []).filter(Boolean);
  const variants = data.variants ?? [];

  for (const v of variants) {
    const clash = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
    if (clash) throw new ApiError(409, `Ya existe una variación con el SKU ${v.sku}.`);
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description,
      brand: data.brand,
      categoryId: data.categoryId,
      price: data.price,
      salePrice: data.salePrice ?? null,
      minPrice: data.minPrice,
      cost: data.cost,
      supplier: data.supplier,
      stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : data.stock,
      minStock: data.minStock,
      imageUrl: data.imageUrl || images[0],
      warrantyMonths: data.warrantyMonths,
      images: {
        create: images.map((url, i) => ({ url, sortOrder: i })),
      },
      variants: {
        create: variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          price: v.price,
          salePrice: v.salePrice ?? null,
          minPrice: v.minPrice ?? null,
          stock: v.stock,
          imageUrl: v.imageUrl || undefined,
        })),
      },
    },
    include: catalogInclude(true),
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    details: { name: product.name, sku: product.sku },
  });

  res.status(201).json(serializeProduct(product));
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const data = updateProductSchema.parse(req.body);

  const before = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Producto no encontrado.");

  const images = data.images;
  const variants = data.variants;

  const product = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: before.id } });
    }

    if (variants) {
      const incomingIds = variants.map((v) => v.id).filter(Boolean) as string[];
      await tx.productVariant.updateMany({
        where: { productId: before.id, id: { notIn: incomingIds } },
        data: { active: false },
      });
      for (const v of variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              sku: v.sku,
              price: v.price,
              salePrice: v.salePrice ?? null,
              minPrice: v.minPrice ?? null,
              stock: v.stock,
              imageUrl: v.imageUrl || null,
              active: true,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: before.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              salePrice: v.salePrice ?? null,
              minPrice: v.minPrice ?? null,
              stock: v.stock,
              imageUrl: v.imageUrl || undefined,
            },
          });
        }
      }
    }

    const variantStock = variants
      ? variants.reduce((s, v) => s + v.stock, 0)
      : undefined;

    return tx.product.update({
      where: { id: before.id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        brand: data.brand,
        categoryId: data.categoryId,
        price: data.price,
        salePrice: data.salePrice,
        minPrice: data.minPrice,
        cost: data.cost,
        supplier: data.supplier,
        stock: variantStock ?? data.stock,
        minStock: data.minStock,
        imageUrl: data.imageUrl || (images && images[0]) || undefined,
        warrantyMonths: data.warrantyMonths,
        images: images
          ? { create: images.map((url, i) => ({ url, sortOrder: i })) }
          : undefined,
      },
      include: catalogInclude(true),
    });
  });

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

  res.json(serializeProduct(product));
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
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { variants: true },
  });
  if (!product) throw new ApiError(404, "Producto no encontrado.");

  const delta = data.type === "SALIDA" ? -Math.abs(data.quantity) : Math.abs(data.quantity);

  if (data.variantId) {
    const variant = product.variants.find((v) => v.id === data.variantId);
    if (!variant) throw new ApiError(404, "Variación no encontrada.");
    const newStock = data.type === "AJUSTE" ? data.quantity : variant.stock + delta;
    if (newStock < 0) throw new ApiError(400, "El stock no puede quedar negativo.");

    const productPatch =
      data.type === "ENTRADA"
        ? {
            ...(data.cost != null ? { cost: data.cost } : {}),
            ...(data.supplier ? { supplier: data.supplier } : {}),
          }
        : {};

    const updated = await prisma.$transaction(async (tx) => {
      const variantRow = await tx.productVariant.update({ where: { id: variant.id }, data: { stock: newStock } });
      if (Object.keys(productPatch).length) {
        await tx.product.update({ where: { id: product.id }, data: productPatch });
      }
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
        },
      });
      return variantRow;
    });
    await recordAudit({
      userId: req.user?.sub,
      action: "INVENTORY_MOVEMENT",
      entity: "ProductVariant",
      entityId: variant.id,
      details: { type: data.type, quantity: data.quantity, from: variant.stock, to: newStock },
    });
    return res.json(updated);
  }

  const newStock = data.type === "AJUSTE" ? data.quantity : product.stock + delta;
  if (newStock < 0) throw new ApiError(400, "El stock no puede quedar negativo.");

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: {
        stock: newStock,
        ...(data.type === "ENTRADA" && data.cost != null ? { cost: data.cost } : {}),
        ...(data.type === "ENTRADA" && data.supplier ? { supplier: data.supplier } : {}),
      },
    }),
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
    include: catalogInclude(true),
  });
  const serialized = products.map(serializeProduct);
  res.json(serialized.filter((p) => p.stock <= p.minStock));
}
