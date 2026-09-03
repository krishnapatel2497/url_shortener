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
} from "../controllers/auth.controller.js";

import { verifyAuthentication } from "../middleware/auth.Middleware.js";

const router = Router();

router.get("/login", getLoginPage);
router.post("/login", postLogin);

router.get("/register", getRegisterPage);
router.post("/register", postRegisterPage);

router.post("/refresh", refreshAccessToken);

router.get("/change-password", verifyAuthentication, changePasswordPage);
router.post("/change-password", verifyAuthentication, changePassword);

//router.get("/logout", logoutUser);
//or
router.post("/logout", logoutUser);

// Export router
export const authRoutes = router;
