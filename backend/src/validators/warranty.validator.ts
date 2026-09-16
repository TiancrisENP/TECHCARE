import { z } from "zod";

export const createWarrantySchema = z.object({
  customerId: z.string().min(1, "Debes seleccionar el usuario de la garantía").optional(),
  productId: z.string().min(1, "Debes seleccionar el producto"),
  orderId: z.string().optional(),
  problem: z.string().min(5, "Describe el problema (mínimo 5 caracteres)"),
  purchaseDate: z.string().datetime().or(z.string().min(1, "La fecha de compra es requerida")),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const updateWarrantyStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "SOLUCIONADA"]),
});
