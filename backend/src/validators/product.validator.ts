import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(2),
  imageUrl: z.string().url().optional(),
  warrantyMonths: z.number().int().nonnegative().default(12),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  reason: z.string().optional(),
});
