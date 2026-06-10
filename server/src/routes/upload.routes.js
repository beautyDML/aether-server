// const express = require("express");
// const multer = require("multer");
// const {
//   uploadImage,
//   uploadDocument,
//   uploadSignature,
// } = require("../services/googledrive.service");

// const router = express.Router();

// // ─── Multer config ────────────────────────────────────────
// // Store files in memory (buffer) — we stream straight to Drive
// const storage = multer.memoryStorage();

// const imageUpload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith("image/")) {
//       return cb(new Error("Only image files are allowed"), false);
//     }
//     cb(null, true);
//   },
// });

// const documentUpload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
//   fileFilter: (req, file, cb) => {
//     const allowed = [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "image/jpeg",
//       "image/png",
//     ];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(
//         new Error("Only PDF, Word documents, or images are allowed"),
//         false
//       );
//     }
//     cb(null, true);
//   },
// });

// // ─── POST /api/upload/image ───────────────────────────────
// // Used by: profile photo, logo
// router.post("/image", imageUpload.single("file"), async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file provided" });
//     }
//     const result = await uploadImage(req.file.buffer, req.file.originalname);
//     res.json({
//       success: true,
//       fileId: result.fileId,
//       url: result.directLink,
//       viewLink: result.viewLink,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // ─── POST /api/upload/document ────────────────────────────
// // Used by: KYC documents, compliance files
// router.post(
//   "/document",
//   documentUpload.single("file"),
//   async (req, res, next) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: "No file provided" });
//       }
//       const result = await uploadDocument(
//         req.file.buffer,
//         req.file.originalname,
//         req.file.mimetype
//       );
//       res.json({
//         success: true,
//         fileId: result.fileId,
//         url: result.directLink,
//         viewLink: result.viewLink,
//         name: req.file.originalname,
//         size: req.file.size,
//         mimeType: req.file.mimetype,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ─── POST /api/upload/signature ───────────────────────────
// // Body: { dataUrl: "data:image/png;base64,..." }
// router.post("/signature", async (req, res, next) => {
//   try {
//     const { dataUrl } = req.body;
//     if (!dataUrl || !dataUrl.startsWith("data:image")) {
//       return res.status(400).json({ error: "Invalid signature data" });
//     }
//     const result = await uploadSignature(dataUrl);
//     res.json({
//       success: true,
//       fileId: result.fileId,
//       url: result.directLink,
//       viewLink: result.viewLink,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;


import { Router } from "express";
import {
  uploadImage,
  uploadDocument,
  uploadMultipleDocuments,
  deleteFile,
} from "../controllers/upload.controller.js";
import {
  uploadSingleImage,
  uploadSingleDocument,
  uploadMultipleFiles,
} from "../middleware/multer.middleware.js";

const router = Router();

// POST /api/upload/image        → single image to Drive
router.post("/image", uploadSingleImage, uploadImage);

// POST /api/upload/document     → single document to Drive
router.post("/document", uploadSingleDocument, uploadDocument);

// POST /api/upload/documents    → multiple documents to Drive
router.post("/documents", uploadMultipleFiles, uploadMultipleDocuments);

// DELETE /api/upload/:fileId    → delete from Drive
router.delete("/:fileId", deleteFile);

export default router;