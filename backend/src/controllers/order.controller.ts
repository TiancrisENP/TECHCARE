import { Response } from "express";
import { prisma } from "../config/db";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/order.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { resolveCustomerId } from "../utils/customer";
import { floorPrice } from "../utils/product";

const STAFF_ROLES = new Set(["ADMIN", "VENDEDOR", "TECNICO"]);

const orderInclude = {
  items: { include: { product: true } },
  customer: { select: { id: true, name: true, email: true, role: true } },
  seller: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
} as const;

export async function listOrders(req: AuthRequest, res: Response) {
  const isStaff = req.user!.role !== "CLIENTE";

  const orders = await prisma.order.findMany({
    where: isStaff ? {} : { customerId: req.user!.sub },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
}

export async function getOrder(req: AuthRequest, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { ...orderInclude, payments: true },
  });
  if (!order) throw new ApiError(404, "Pedido no encontrado.");

  if (req.user!.role === "CLIENTE" && order.customerId !== req.user!.sub) {
    throw new ApiError(403, "No puedes ver pedidos de otro cliente.");
  }

  res.json(order);
}

async function assertStaffUser(id: string, kind: "seller" | "technician") {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.active) {
    throw new ApiError(400, kind === "seller" ? "El vendedor no está disponible." : "El técnico no está disponible.");
  }
  if (kind === "seller" && !STAFF_ROLES.has(user.role)) {
    throw new ApiError(400, "La venta debe registrarla un vendedor, técnico o administrador.");
  }
  if (kind === "technician" && user.role !== "TECNICO" && user.role !== "ADMIN") {
    throw new ApiError(400, "El técnico seleccionado no tiene rol de técnico.");
  }
  return user;
}

/**
 * Flujo: Carrito -> Checkout -> Pedido -> Pago -> Venta -> Descuento de inventario.
 * Todo ocurre en una transacción para evitar sobreventa.
 */
export async function createOrder(req: AuthRequest, res: Response) {
  const data = createOrderSchema.parse(req.body);
  const customerId = await resolveCustomerId(req, data.customerId);
  const sellerId = data.sellerId || (STAFF_ROLES.has(req.user!.role) ? req.user!.sub : "");
  if (!sellerId) throw new ApiError(400, "Debes indicar el vendedor o técnico de la venta.");

  await assertStaffUser(sellerId, "seller");
  if (data.technicianId) await assertStaffUser(data.technicianId, "technician");

  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const itemsData = [];

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.active) {
        throw new ApiError(400, `Producto no disponible: ${item.productId}`);
      }

      const serial = item.serialNumber.trim();
      if (!serial) {
        throw new ApiError(400, `Indica el serial de ${product.name}.`);
      }

      const activeVariants = product.variants.filter((v) => v.active);
      const variant = item.variantId
        ? activeVariants.find((v) => v.id === item.variantId)
        : activeVariants.length === 1
        ? activeVariants[0]
        : null;

      if (item.variantId && !variant) {
        throw new ApiError(400, "La variación seleccionada no está disponible.");
      }
      if (!variant && activeVariants.length > 1) {
        throw new ApiError(400, `Selecciona color o modelo para ${product.name}.`);
      }

      const min = floorPrice(
        variant?.minPrice != null ? Number(variant.minPrice) : product.minPrice != null ? Number(product.minPrice) : null,
        Number(product.cost)
      );
      const unitPrice = item.unitPrice;
      if (unitPrice + 1e-6 < min) {
        throw new ApiError(
          400,
          `El precio de ${product.name} no puede ser menor al mínimo ($${min.toLocaleString("es-CO")}).`
        );
      }

      const stock = variant ? variant.stock : product.stock;
      const label = variant ? `${product.name} (${variant.name})` : product.name;
      if (stock < item.quantity) {
        throw new ApiError(400, `Stock insuficiente para ${label}. Disponible: ${stock}`);
      }

      total += unitPrice * item.quantity;
      itemsData.push({
        productId: product.id,
        variantId: variant?.id,
        quantity: item.quantity,
        unitPrice,
        serialNumber: serial,
      });

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          variantId: variant?.id,
          type: "SALIDA",
          quantity: item.quantity,
          reason: `Venta serial ${serial}`,
        },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        customerId,
        sellerId,
        technicianId: data.technicianId || null,
        status: "PAGADO",
        total,
        paymentMethod: data.paymentMethod,
        items: { create: itemsData },
        payments: { create: { amount: total, method: data.paymentMethod } },
      },
      include: orderInclude,
    });

    return newOrder;
  });

  await recordAudit({
    userId: req.user!.sub,
    action: "ORDER_CREATED",
    entity: "Order",
    entityId: order.id,
    details: { total: order.total, customerId, sellerId, paymentMethod: data.paymentMethod },
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
