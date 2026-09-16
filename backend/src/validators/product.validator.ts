import { z } from "zod";

const imageUrl = z.string().min(4, "URL de imagen inválida");

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Indica color o modelo"),
  sku: z.string().min(2),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  minPrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  imageUrl: z.string().optional().nullable(),
});

export const productFieldsSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().positive({ message: "Indica el precio recomendado" }),
  salePrice: z.number().positive().optional().nullable(),
  minPrice: z.number().nonnegative({ message: "Indica el precio mínimo" }),
  cost: z.number().nonnegative({ message: "Indica el costo del producto" }),
  supplier: z.string().min(2, "Indica el proveedor"),
  stock: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(2),
  imageUrl: z.string().optional(),
  images: z.array(imageUrl).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
  warrantyMonths: z.number().int().nonnegative().default(12),
});

export const createProductSchema = productFieldsSchema.refine((data) => data.minPrice <= data.price, {
  message: "El precio mínimo no puede ser mayor al precio recomendado.",
  path: ["minPrice"],
});

export const updateProductSchema = productFieldsSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  reason: z.string().optional(),
  variantId: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  supplier: z.string().min(2).optional(),
});
