import express from "express";

import {
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword,
} from "../controllers/password-reset.controller.js";

const router = express.Router();

// Forgot password page
router.get("/forgot-password", showForgotPassword);

// Send reset email
router.post("/forgot-password", forgotPassword);

// Reset password page
router.get("/reset-password", showResetPassword);

// Update password
router.post("/reset-password", resetPassword);

export default router;
