import { uploadFileToDrive, deleteFileFromDrive } from "../services/googledrive.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  const { buffer, originalname, mimetype } = req.file;

  const result = await uploadFileToDrive(
    buffer,
    originalname,
    mimetype,
    "profile-images" // subfolder in Drive
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Image uploaded successfully")
  );
});

// ─── Upload single document ───────────────────────────────────────────────────
// POST /api/upload/document
// Form field: "document"
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No document file provided");
  }

  const { buffer, originalname, mimetype } = req.file;

  const result = await uploadFileToDrive(
    buffer,
    originalname,
    mimetype,
    "documents" // subfolder in Drive
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Document uploaded successfully")
  );
});

// ─── Upload multiple documents ────────────────────────────────────────────────
// POST /api/upload/documents
// Form field: "files" (array)
export const uploadMultipleDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files provided");
  }

  const uploadPromises = req.files.map((file) =>
    uploadFileToDrive(file.buffer, file.originalname, file.mimetype, "documents")
  );

  const results = await Promise.all(uploadPromises);

  return res.status(200).json(
    new ApiResponse(200, results, `${results.length} file(s) uploaded successfully`)
  );
});

// ─── Delete a file from Drive ─────────────────────────────────────────────────
// DELETE /api/upload/:fileId
export const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    throw new ApiError(400, "File ID is required");
  }

  await deleteFileFromDrive(fileId);

  return res.status(200).json(
    new ApiResponse(200, { fileId }, "File deleted successfully")
  );
});