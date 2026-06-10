import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed: ${file.mimetype}`), false);
  }
};

const limits = { fileSize: 10 * 1024 * 1024 };

const uploadSingleImage = multer({ storage, fileFilter, limits }).single("image");
const uploadSingleDocument = multer({ storage, fileFilter, limits }).single("document");
const uploadMultipleFiles = multer({ storage, fileFilter, limits }).array("files", 10);
const uploadMixed = multer({ storage, fileFilter, limits }).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

export { uploadSingleImage, uploadSingleDocument, uploadMultipleFiles, uploadMixed };