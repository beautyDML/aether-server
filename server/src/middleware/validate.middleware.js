import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg);
    throw new ApiError(400, "Validation failed", errorMessages);
  }
  next();
};

export { validate };