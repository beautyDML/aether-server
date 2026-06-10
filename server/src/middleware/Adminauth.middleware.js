import { ApiError } from "../utils/ApiError.js";

// ── Simple token-based admin auth ─────────────────────────────────────────
// Add ADMIN_SECRET to your .env
// Admin panel sends: Authorization: Bearer <ADMIN_SECRET>
export const adminAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Admin access required");
  }

  const token = header.split(" ")[1];

  if (token !== process.env.ADMIN_SECRET) {
    throw new ApiError(403, "Invalid admin token");
  }

  next();
};