import { Router } from "express";
import * as controller from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", controller.listOrders); // staff ve todo, cliente ve lo suyo
router.get("/:id", controller.getOrder);
router.post("/", controller.createOrder); // cualquier usuario autenticado compra
router.put("/:id/status", requireRole("ADMIN", "VENDEDOR"), controller.updateOrderStatus);

export default router;
