import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(requireAuth);

router.get(
  "/assignable",
  requireRole("ADMIN", "VENDEDOR", "TECNICO"),
  controller.listAssignableUsers
);

router.get("/", requireRole("ADMIN"), controller.listUsers);
router.post("/", requireRole("ADMIN"), controller.createUser);
router.put("/:id/role", requireRole("ADMIN"), controller.updateUserRole);
router.put("/:id/active", requireRole("ADMIN"), controller.toggleUserActive);

export default router;
