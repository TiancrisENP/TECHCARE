import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadImages } from "../controllers/upload.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
          cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP)."));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);
router.post("/", upload.array("files", 8), uploadImages);

export default router;
