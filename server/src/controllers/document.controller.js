import Onboarding from "../models/onboarding.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const getAllDocuments = asyncHandler(async (req, res) => {
  const submissions = await Onboarding.find().lean();
  const docs = [];

  submissions.forEach((item) => {
    const applicant =
      `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
      item.companyName ||
      item.legalName ||
      "Unknown";

    // 1. ID FRONT
    if (item.idFront?.file) {
      docs.push({
        submissionId: item._id,
        documentType: "idFront",
        type: "ID Front",
        applicant,
        status: item.idFront.status || "pending",
        file: item.idFront.file,
      });
    }

    // 2. ID BACK
    if (item.idBack?.file) {
      docs.push({
        submissionId: item._id,
        documentType: "idBack",
        type: "ID Back",
        applicant,
        status: item.idBack.status || "pending",
        file: item.idBack.file,
      });
    }

    // 3. PROFILE IMAGE
    if (item.profileImage?.fileId) {
      docs.push({
        submissionId: item._id,
        documentType: "profileImage",
        type: "Profile Image",
        applicant,
        status: "pending",
        file: item.profileImage,
      });
    }

    // 4. COMPLIANCE DOCUMENTS (business / enterprise)
    // These are uploaded via DocumentChecklist with types like
    // "Certificate of Incorporation", "Tax Registration", etc.
  const fallbackTypes = [
  "Certificate of Incorporation",
  "Tax Registration",
  "Proof of Address",
  "Beneficial Owner Declaration",
];

if (Array.isArray(item.documents) && item.documents.length > 0) {
  item.documents.forEach((doc, index) => {
    if (!doc?.file) return;

    docs.push({
      submissionId: item._id,
      documentType: `documents.${index}`,

      type:
        doc.type ||
        doc.documentType ||
        fallbackTypes[index] ||
        "Supporting Document",

      applicant,
      status: doc.status || "pending",
      file: doc.file,
    });
  });
}
  });

  return res
    .status(200)
    .json(new ApiResponse(200, docs, "Documents fetched successfully"));
});

// ─── PATCH /api/admin/submissions/:id/document-status ────────────────────────
export const updateDocumentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { documentType, status } = req.body;

  const allowedStatuses = ["pending", "verified", "rejected"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Use: pending, verified, or rejected",
    );
  }

  const submission = await Onboarding.findById(id);
  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  if (documentType.startsWith("documents.")) {
    // Compliance doc at index e.g. "documents.0"
    const index = parseInt(documentType.split(".")[1], 10);

    if (!Array.isArray(submission.documents) || !submission.documents[index]) {
      throw new ApiError(404, `Document at index ${index} not found`);
    }

    submission.documents[index].status = status;
    submission.markModified("documents");
  } else if (documentType === "idFront") {
    if (!submission.idFront) throw new ApiError(400, "idFront not found");
    submission.idFront.status = status;
    submission.markModified("idFront");
  } else if (documentType === "idBack") {
    if (!submission.idBack) throw new ApiError(400, "idBack not found");
    submission.idBack.status = status;
    submission.markModified("idBack");
  } else if (documentType === "profileImage") {
    
  } else {
    throw new ApiError(400, `Unknown documentType: ${documentType}`);
  }

  await submission.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, submission, "Document status updated successfully"),
    );
});
