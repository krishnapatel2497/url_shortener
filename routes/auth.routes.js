import { Router } from "express";

import {
  getLoginPage,
  postLogin,
  getRegisterPage,
  postRegisterPage,
  refreshAccessToken,
  logoutUser,
  changePasswordPage,
  changePassword,
  setPasswordPage,
  setPassword,
  googleLogin,
  googleCallback,
} from "../controllers/auth.controller.js";

import { verifyAuthentication } from "../middleware/auth.Middleware.js";

const router = Router();

// Normal Authentication
router.get("/login", getLoginPage);

router.post("/login", postLogin);

router.get("/register", getRegisterPage);

router.post("/register", postRegisterPage);

router.post("/refresh", refreshAccessToken);

router.get("/change-password", verifyAuthentication, changePasswordPage);
router.post("/change-password", verifyAuthentication, changePassword);

// Set Password for Google-only users
router.get("/set-password", verifyAuthentication, setPasswordPage);
router.post("/set-password", verifyAuthentication, setPassword);

router.post("/logout", logoutUser);


// Google OAuth


// Step 1: Start Google Login
router.get("/google", googleLogin);

// Step 2: Google redirects user here
router.get("/google/callback", googleCallback);

// Export router
export const authRoutes = router;
