import { Router } from "express";
import * as controller from "../controllers/product.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Catálogo público: cualquiera puede ver productos activos, sin login
router.get("/", controller.listProducts);
router.get("/low-stock", requireAuth, requireRole("ADMIN", "VENDEDOR", "TECNICO"), controller.listLowStock);
router.get("/:id", controller.getProduct);

// Gestión: solo Admin y Vendedor
router.post("/", requireAuth, requireRole("ADMIN", "VENDEDOR"), controller.createProduct);
router.put("/:id", requireAuth, requireRole("ADMIN", "VENDEDOR"), controller.updateProduct);
router.delete("/:id", requireAuth, requireRole("ADMIN"), controller.deactivateProduct);
router.post("/:id/stock", requireAuth, requireRole("ADMIN", "VENDEDOR"), controller.adjustStock);

export default router;
