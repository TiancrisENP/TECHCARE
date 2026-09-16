import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "VENDEDOR", "TECNICO"));

router.get("/", controller.getDashboardStats);
router.get("/sales-by-month", controller.getSalesByMonth);
router.get("/top-products", controller.getTopProducts);

export default router;
