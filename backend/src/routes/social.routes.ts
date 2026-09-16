import { Router } from "express";
import * as controller from "../controllers/social.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/public", controller.listPublicSocialLinks);

router.use(requireAuth, requireRole("ADMIN"));
router.get("/", controller.listSocialLinks);
router.post("/", controller.createSocialLink);
router.put("/:id", controller.updateSocialLink);
router.delete("/:id", controller.deleteSocialLink);

export default router;
