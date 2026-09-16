import { Router } from "express";
import { Response } from "express";
import { prisma } from "../config/db";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", async (req: AuthRequest, res: Response) => {
  const { entity, userId, take } = req.query;

  const logs = await prisma.auditLog.findMany({
    where: {
      entity: entity ? String(entity) : undefined,
      userId: userId ? String(userId) : undefined,
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: take ? Number(take) : 100,
  });

  res.json(logs);
});

export default router;
