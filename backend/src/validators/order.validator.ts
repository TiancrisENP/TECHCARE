import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Debes indicar el cliente de la venta").optional(),
  sellerId: z.string().min(1, "Debes indicar el vendedor o técnico que registra la venta"),
  technicianId: z.string().min(1).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive({ message: "Indica el precio de venta" }),
        serialNumber: z.string().min(3, "Indica el número de serial").max(80),
      })
    )
    .min(1, "El pedido debe tener al menos un producto"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"]),
});
