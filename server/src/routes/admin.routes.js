import express from "express";
import {
  getAllSubmissions,
  getSubmission,
  updateStatus,
  getStats
} from "../controllers/admin.controller.js";
import {
  getAllDocuments,
  updateDocumentStatus
} from "../controllers/document.controller.js"; // Imported from your new dedicated controller

const router = express.Router();

// ─── Stats Dashboard ─────────────────────────────────────────────────────────
router.get("/stats", getStats);

// ─── Submissions Management ──────────────────────────────────────────────────
// All submissions (with optional ?status=&search=&page=&limit=)
router.get("/submissions", getAllSubmissions);

// Single submission detail
router.get("/submissions/:id", getSubmission);

// Global status update (approve / reject / under_review for the overall profile)
router.patch("/submissions/:id/status", updateStatus);

// ─── Document Verification Management ────────────────────────────────────────
// Get all documents across all users (deduplicated)
router.get("/documents", getAllDocuments);

// Update status of an individual document (idFront, idBack, or documents._id)
router.patch(
  "/submissions/:id/document-status",
  updateDocumentStatus
);

export default router;
