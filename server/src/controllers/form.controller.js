// const asyncHandler = require("../utils/asyncHandler");
// const ApiError = require("../utils/ApiError");
// const ApiResponse = require("../utils/ApiResponse");
// const { saveFormDraft, getFormDraft } = require("../services/form.service");

// // POST /api/form/draft
// // Saves current step progress so user can resume later
// const saveDraft = asyncHandler(async (req, res) => {
//   const { email, currentStep, stepData, uploadedFiles } = req.body;

//   if (!email) throw new ApiError(400, "email is required to save a draft");

//   const draft = await saveFormDraft(email, currentStep, stepData, uploadedFiles);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { draftId: draft._id }, "Draft saved"));
// });

// // GET /api/form/draft/:email
// // Loads a saved draft so the frontend can restore the form state
// const loadDraft = asyncHandler(async (req, res) => {
//   const draft = await getFormDraft(req.params.email);

//   if (!draft) {
//     return res
//       .status(200)
//       .json(new ApiResponse(200, null, "No draft found"));
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { draft }, "Draft loaded"));
// });

// module.exports = { saveDraft, loadDraft };

import Form from "../models/form.model.js";
import { uploadFileToDrive } from "../services/googledrive.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Submit form (with optional file attachments) ─────────────────────────────
// POST /api/form/submit
export const submitForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message, formType } = req.body;

  if (!name || !email || !message) {
    throw new ApiError(400, "Name, email, and message are required");
  }

  let attachments = [];

  // Upload any attached files to Drive
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) =>
      uploadFileToDrive(file.buffer, file.originalname, file.mimetype, "form-attachments")
    );
    const results = await Promise.all(uploadPromises);
    attachments = results.map((r) => ({
      fileId: r.fileId,
      fileName: r.fileName,
      webViewLink: r.webViewLink,
      directUrl: r.directUrl,
    }));
  }

  const form = await Form.create({
    name,
    email,
    subject,
    message,
    formType: formType || "contact",
    attachments,
    ipAddress: req.ip,
  });

  return res.status(201).json(
    new ApiResponse(201, form, "Form submitted successfully")
  );
});

// ─── Get all forms (admin) ────────────────────────────────────────────────────
// GET /api/form
export const getAllForms = asyncHandler(async (req, res) => {
  const forms = await Form.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, forms));
});