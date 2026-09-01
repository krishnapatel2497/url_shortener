import express from "express";

import {
  getVerifyEmailPage,
  verifyEmail,
} from "../controllers/verification.controller.js";

const router = express.Router();

//GET VERIFY EMAIL PAGE
router.get("/verify-email", getVerifyEmailPage);

//POST VERIFY EMAIL CODE
router.post("/verify-email", verifyEmail);

export default router;
