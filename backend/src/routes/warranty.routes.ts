import { Router } from "express";
import * as controller from "../controllers/warranty.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", controller.listWarranties);
router.get("/:id", controller.getWarranty);
router.post("/", requireRole("ADMIN", "TECNICO", "CLIENTE"), controller.createWarranty);
router.put("/:id/status", requireRole("ADMIN", "TECNICO"), controller.updateWarrantyStatus);

export default router;
