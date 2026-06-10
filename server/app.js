import express from "express";
import cors from "cors";
import "dotenv/config";

import onboardingRoutes from "./src/routes/onboarding.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import formRoutes from "./src/routes/form.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";

import { errorMiddleware } from "./src/middleware/error.middleware.js";

import {
  getAuthUrl,
  getTokensFromCode,
} from "./src/config/googleDrive.config.js";

const app = express();


// ─── CORS ─────────────────────────────────────

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://aether-admin-panel.onrender.com",
        "https://aether-admin-panel.onrender.com/submissions",
      "https://aether-admin-panel.onrender.com/UnderReview",
      "https://aether-admin-panel.onrender.com/approved",
      "https://aether-admin-panel.onrender.com/rejected",
      "https://aether-admin-panel.onrender.com/documents",
      "https://aether-admin-panel.onrender.com/settings",
        "https://aethercapital3.onrender.com",
    ],

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);


// ─── Body Parser ─────────────────────────────

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);


// ─── Health Route ────────────────────────────

app.get("/health", (req, res) => {

  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });

});


// ─── Google OAuth ────────────────────────────

app.get("/api/auth/google", (req, res) => {

  const url = getAuthUrl();

  res.redirect(url);

});


app.get("/api/auth/google/callback", async (req, res) => {

  try {

    const { code } = req.query;

    const tokens =
    await getTokensFromCode(code);

    console.log(
      "✅ REFRESH TOKEN:",
      tokens.refresh_token
    );

    res.send(`
      <h2>✅ Auth successful!</h2>

      <p>
        Copy this into your .env
      </p>

      <pre>
${tokens.refresh_token}
      </pre>
    `);

  } catch (err) {

    res.status(500).send(
      "Auth failed: " + err.message
    );

  }

});


// ─── API Routes ──────────────────────────────

app.use("/api/onboarding", onboardingRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/form", formRoutes);

app.use("/api/admin", adminRoutes);


// ─── 404 ─────────────────────────────────────

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });

});


// ─── Error Middleware ────────────────────────

app.use(errorMiddleware);

export default app;
