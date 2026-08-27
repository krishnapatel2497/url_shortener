import { Router } from "express";
import {
  getLoginPage,
  postLogin,
  getRegisterPage,
  postRegisterPage,
  refreshAccessToken,
  logoutUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", getLoginPage);
router.post("/login", postLogin);

router.get("/register", getRegisterPage);
router.post("/register", postRegisterPage);

router.post("/refresh", refreshAccessToken);

//router.get("/logout", logoutUser);
//or
router.post("/logout", logoutUser);

// Export router
export const authRoutes = router;
