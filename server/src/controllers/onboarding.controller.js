import Onboarding from "../models/onboarding.model.js";
import { uploadFileToDrive } from "../services/googledrive.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Risk Score Calculator ────────────────────────────────────────────────────
export const calculateRiskScore = ({
  accountType,
  country,
  roles,
  twoFactorEnabled,
  questionnaire,
}) => {
  let score = 0;

  if (accountType === "enterprise") score += 15;
  else if (accountType === "business") score += 10;
  else score += 5;

  if (Array.isArray(roles)) {
    if (roles.includes("Admin")) score += 10;
    if (roles.includes("Billing")) score += 5;
  }

  if (!twoFactorEnabled) score += 10;

  if (questionnaire.regulated) score += 10;
  if (questionnaire.pii) score += 8;
  if (questionnaire.payments) score += 10;
  if (questionnaire.minors_pii) score += 8;
  if (questionnaire.soc2) score += 5;
  if (questionnaire.crypto) score += 15;
  if (questionnaire.sanctioned_regions) score += 20;
  if (questionnaire.pep_services) score += 12;
  if (questionnaire.cross_border_storage) score += 8;

  if (["AF", "IR", "KP"].includes(country)) score += 25;

  return Math.min(score, 100);
};

// ─── Helper: upload base64 string to Drive ────────────────────────────────────
const uploadBase64ToDrive = async (base64String, fileName, mimeType, folder) => {
  if (!base64String) return null;
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  return uploadFileToDrive(buffer, fileName, mimeType, folder);
};

// ─── Safe JSON parse helper ───────────────────────────────────────────────────
const parseSafe = (val, fallback = null) => {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

// ─── Submit Onboarding ────────────────────────────────────────────────────────
export const submitOnboarding = asyncHandler(async (req, res) => {

  const raw = req.body.formData ? JSON.parse(req.body.formData) : req.body;
  const { operatingHours, documentLabels } = raw;

  const {
    accountType,
    firstName, middleName, lastName,
    dobDay, dobMonth, dobYear,
    gender, nationality,
    country, address1, address2, city, state, zip, timezone,
    sameAsPrimary, mailAddress1, mailCity, mailState, mailPostal,
    roles, departments, permissions, twoFA, tfaMethod,
    answers, questionnaire,
    signatureData, agreedToTerms,
    companyName, legalName, tradeName, regNumber, regDate,
    industry, employeeRange, subsidiaryCount, parentCompany,
    isListed, tickerSymbol,
    email,
  } = raw;

  // ── Normalise questionnaire ───────────────────────────────────────────────
  const rawQuestionnaire = (() => {
    const a = parseSafe(answers,       null);
    const q = parseSafe(questionnaire, null);
    if (a && typeof a === "object" && !Array.isArray(a) && Object.keys(a).length > 0) return a;
    if (q && typeof q === "object" && !Array.isArray(q) && Object.keys(q).length > 0) return q;
    return {};
  })();

  const parsedRoles       = parseSafe(roles,       []);
  const parsedDepartments = parseSafe(departments, []);
  const parsedPermissions = parseSafe(permissions, {});
  const isTwoFAEnabled    = twoFA === "true" || twoFA === true;

  // ── Upload files to Drive ─────────────────────────────────────────────────
  const driveUploads = {};

  const DOC_LABELS = {
    incorp_cert:  "Certificate of Incorporation",
    tax_id:       "Tax Registration",
    proof_addr:   "Proof of Address",
    ubo_registry: "Beneficial Owner Declaration",
  };

  // ── Parse documents — handle both array (new) and map (legacy) shapes ─────
  const rawDocs = parseSafe(raw.documents, null);

  console.log("📥 rawDocs:", JSON.stringify(rawDocs, null, 2));
  console.log("📥 IS ARRAY:", Array.isArray(rawDocs));

  if (Array.isArray(rawDocs)) {
    // Frontend already sent a transformed array — use directly
    driveUploads.documents = Object.entries(parsedDocuments).map(([key, value]) => ({
  documentType: DOC_LABELS[key] || key,  // was: type
  file: {
    fileId:      value.fileId,
    fileName:    value.name,
    directUrl:   value.driveUrl,
    webViewLink: value.driveViewLink,
    mimeType:    value.mimeType,
  },
  status: "pending",
}));
  } else if (rawDocs && typeof rawDocs === "object") {
    // Legacy map shape { incorp_cert: {...}, tax_id: {...} }
    driveUploads.documents = Object.entries(rawDocs)
      .map(([key, value]) => {
        if (!value || typeof value !== "object") return null;
        return {
          type: DOC_LABELS[key] || key,
          file: {
            fileId:      value.fileId        || null,
            fileName:    value.name          || null,
            directUrl:   value.driveUrl      || null,
            webViewLink: value.driveViewLink || null,
            mimeType:    value.mimeType      || null,
          },
          status: "pending",
        };
      })
      .filter(Boolean);
  } else {
    driveUploads.documents = [];
  }

  console.log("✅ driveUploads.documents:", JSON.stringify(driveUploads.documents, null, 2));

  // ── Identity docs ─────────────────────────────────────────────────────────
  if (req.files?.idFront?.[0]) {
    const f = req.files.idFront[0];
    driveUploads.idFront = await uploadFileToDrive(
      f.buffer, f.originalname, f.mimetype, "identity-docs"
    );
  }

  if (req.files?.idBack?.[0]) {
    const f = req.files.idBack[0];
    driveUploads.idBack = await uploadFileToDrive(
      f.buffer, f.originalname, f.mimetype, "identity-docs"
    );
  }

  if (signatureData) {
    driveUploads.signature = await uploadBase64ToDrive(
      signatureData,
      `sig_${Date.now()}.png`,
      "image/png",
      "signatures"
    );
  }

  // ── Risk Score ────────────────────────────────────────────────────────────
  const finalRiskScore = calculateRiskScore({
    accountType,
    country,
    roles:            parsedRoles,
    twoFactorEnabled: isTwoFAEnabled,
    questionnaire:    rawQuestionnaire,
  });

  const finalRiskLevel =
    finalRiskScore >= 70 ? "high"
    : finalRiskScore >= 40 ? "medium"
    : "low";


    console.log(
  "FINAL DOCUMENTS TYPE:",
  typeof driveUploads.documents
);

console.log(
  "IS ARRAY:",
  Array.isArray(driveUploads.documents)
);

console.log(
  "FINAL DOCUMENTS:",
  JSON.stringify(driveUploads.documents, null, 2)
);
  // ── Save to MongoDB ───────────────────────────────────────────────────────
  const onboarding = await Onboarding.create({
    accountType,
    email,

    firstName, middleName, lastName,
    dateOfBirth: dobDay && dobMonth && dobYear
      ? new Date(`${dobYear}-${dobMonth}-${dobDay}`)
      : undefined,
    gender, nationality,

    companyName, legalName, tradeName, regNumber, regDate,
    industry, employeeRange,
    subsidiaryCount: subsidiaryCount ? Number(subsidiaryCount) : undefined,
    parentCompany, isListed, tickerSymbol,

    address: {
      street:     address1,
      street2:    address2,
      city, state,
      postalCode: zip,
      country,
      timezone,
    },

    operatingHours: parseSafe(operatingHours, []),

    sameAsPrimary: sameAsPrimary === "true" || sameAsPrimary === true,
    mailingAddress: !(sameAsPrimary === "true" || sameAsPrimary === true)
      ? { street: mailAddress1, city: mailCity, state: mailState, postalCode: mailPostal }
      : undefined,

    roles:            parsedRoles,
    departments:      parsedDepartments,
    permissions:      parsedPermissions,
    twoFactorEnabled: isTwoFAEnabled,
    twoFactorMethod:  tfaMethod,

    questionnaire: rawQuestionnaire,
    riskScore:     finalRiskScore,
    riskLevel:     finalRiskLevel,

    termsAccepted:   agreedToTerms === "true" || agreedToTerms === true,
    termsAcceptedAt: new Date(),
    submittedAt:     new Date(),
    status:          "submitted",

    profileImage: driveUploads.profileImage,
    idFront: { file: driveUploads.idFront, status: "pending" },
    idBack:  { file: driveUploads.idBack,  status: "pending" },
    documents: driveUploads.documents || [],
    signature: driveUploads.signature
      ? { driveFile: driveUploads.signature, signedAt: new Date() }
      : undefined,
  });

  return res.status(201).json(
    new ApiResponse(201, { id: onboarding._id }, "Application submitted successfully! 🎉")
  );
});

// ─── Get single onboarding ────────────────────────────────────────────────────
export const getOnboarding = asyncHandler(async (req, res) => {
  const doc = await Onboarding.findById(req.params.id);
  if (!doc) throw new ApiError(404, "Onboarding record not found");
  return res.status(200).json(new ApiResponse(200, doc));
});

// ─── Get all onboardings ──────────────────────────────────────────────────────
export const getAllOnboardings = asyncHandler(async (req, res) => {
  const docs = await Onboarding.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, docs));
});
