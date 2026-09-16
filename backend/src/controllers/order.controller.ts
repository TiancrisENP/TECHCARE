import { Response } from "express";
import { prisma } from "../config/db";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/order.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { resolveCustomerId } from "../utils/customer";

export async function listOrders(req: AuthRequest, res: Response) {
  const isStaff = req.user!.role !== "CLIENTE";

  const orders = await prisma.order.findMany({
    where: isStaff ? {} : { customerId: req.user!.sub },
    include: { items: { include: { product: true } }, customer: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
}

export async function getOrder(req: AuthRequest, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, payments: true, customer: true },
  });
  if (!order) throw new ApiError(404, "Pedido no encontrado.");

  if (req.user!.role === "CLIENTE" && order.customerId !== req.user!.sub) {
    throw new ApiError(403, "No puedes ver pedidos de otro cliente.");
  }

  res.json(order);
}

/**
 * Flujo: Carrito -> Checkout -> Pedido -> Pago -> Venta -> Descuento de inventario.
 * Todo ocurre en una transacción para evitar sobreventa.
 */
export async function createOrder(req: AuthRequest, res: Response) {
  const data = createOrderSchema.parse(req.body);
  const customerId = await resolveCustomerId(req, data.customerId);

  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const itemsData = [];

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active) {
        throw new ApiError(400, `Producto no disponible: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
      }

      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;
      itemsData.push({ productId: product.id, quantity: item.quantity, unitPrice });

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "SALIDA",
          quantity: item.quantity,
          reason: "Venta",
        },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        customerId,
        status: "PAGADO",
        total,
        paymentMethod: data.paymentMethod,
        items: { create: itemsData },
        payments: { create: { amount: total, method: data.paymentMethod } },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    return newOrder;
  });

  await recordAudit({
    userId: req.user!.sub,
    action: "ORDER_CREATED",
    entity: "Order",
    entityId: order.id,
    details: { total: order.total, customerId },
  });

  res.status(201).json(order);
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  const data = updateOrderStatusSchema.parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: data.status },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: order.id,
    details: { status: data.status },
  });

  res.json(order);
}
