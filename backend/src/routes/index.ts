import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import serviceRoutes from "./service.routes";
import warrantyRoutes from "./warranty.routes";
import userRoutes from "./user.routes";
import dashboardRoutes from "./dashboard.routes";
import auditRoutes from "./audit.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/services", serviceRoutes);
router.use("/warranties", warrantyRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/audit", auditRoutes);

export default router;
