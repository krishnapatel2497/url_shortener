import express from "express";

import {
  getVerifyEmailPage,
  verifyEmail,
  verifyEmailByLink,
} from "../controllers/verification.controller.js";

const router = express.Router();

//GET VERIFY EMAIL PAGE
router.get("/verify-email", getVerifyEmailPage);

//POST VERIFY EMAIL USING 8-DIGIT CODE
router.post("/verify-email", verifyEmail);

//GET VERIFY EMAIL USING GMAIL LINK
router.get("/verify-email/link", verifyEmailByLink);

export default router;
