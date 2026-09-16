import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Debes indicar el usuario de la venta").optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "El pedido debe tener al menos un producto"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "MOCK"]).default("MOCK"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"]),
});
