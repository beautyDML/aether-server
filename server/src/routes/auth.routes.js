import express from "express";
import {
  getAuthUrl,
  getTokensFromCode,
} from "../config/googleDrive.config.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const tokens = await getTokensFromCode(code);

    console.log("TOKENS:", tokens);

    res.send("Google authentication successful");

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
