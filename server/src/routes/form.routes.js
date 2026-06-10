import { Router } from "express";
import { submitForm, getAllForms } from "../controllers/form.controller.js";
import { uploadMultipleFiles } from "../middleware/multer.middleware.js";

const router = Router();

// POST /api/form/submit   → submit with optional file attachments
router.post("/submit", uploadMultipleFiles, submitForm);

// GET  /api/form          → admin: get all submissions
router.get("/", getAllForms);

export default router;