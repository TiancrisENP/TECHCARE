import { Router } from "express";
import * as controller from "../controllers/service.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Público, sin login: seguimiento por código de tracking
router.get("/track/:code", controller.trackService);

router.use(requireAuth);

router.get("/", controller.listServices);
router.get("/:id", controller.getService);
router.post("/", requireRole("ADMIN", "TECNICO", "CLIENTE"), controller.createService);
router.put("/:id/status", requireRole("ADMIN", "TECNICO"), controller.updateServiceStatus);
router.put("/:id/assign", requireRole("ADMIN"), controller.assignTechnician);
router.put("/:id/diagnosis", requireRole("ADMIN", "TECNICO"), controller.setDiagnosis);

export default router;
