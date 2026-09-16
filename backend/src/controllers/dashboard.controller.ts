import { Response } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [salesAgg, ordersCount, servicesCount, warrantiesCount, allProducts] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELADO" } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.service.count({ where: { status: { notIn: ["ENTREGADO", "CANCELADO"] } } }),
    prisma.warranty.count({ where: { status: { in: ["PENDIENTE", "EN_REVISION"] } } }),
    prisma.product.findMany({ where: { active: true } }),
  ]);

  const lowStock = allProducts.filter((p) => p.stock <= p.minStock).length;

  res.json({
    salesThisMonth: Number(salesAgg._sum.total ?? 0),
    orders: ordersCount,
    services: servicesCount,
    warranties: warrantiesCount,
    lowStock,
  });
}

export async function getSalesByMonth(_req: AuthRequest, res: Response) {
  // Agregación simple en memoria: agrupa ventas de los últimos 6 meses.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: sixMonthsAgo }, status: { not: "CANCELADO" } },
    select: { createdAt: true, total: true },
  });

  const byMonth: Record<string, number> = {};
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + Number(o.total);
  }

  res.json(Object.entries(byMonth).map(([month, total]) => ({ month, total })));
}

export async function getTopProducts(_req: AuthRequest, res: Response) {
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });

  const result = items.map((i) => ({
    product: products.find((p) => p.id === i.productId)?.name ?? "Desconocido",
    quantity: i._sum.quantity ?? 0,
  }));

  res.json(result);
}
