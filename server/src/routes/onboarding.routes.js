import { Router } from "express";
import {
  submitOnboarding,
  getOnboarding,
  getAllOnboardings,
} from "../controllers/onboarding.controller.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Mixed fields for the full submit
const uploadFields = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "idFront",      maxCount: 1 },
  { name: "idBack",       maxCount: 1 },
  { name: "documents",    maxCount: 10 },
]);

const router = Router();

// POST /api/onboarding/submit  → full submit with all files + form data
router.post("/submit", uploadFields, submitOnboarding);

// GET  /api/onboarding         → all submissions (admin)
router.get("/", getAllOnboardings);

// GET  /api/onboarding/:id     → single submission
router.get("/:id", getOnboarding);

export default router;