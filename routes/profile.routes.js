import express from "express";

import {
  getProfilePage,
  getEditProfilePage,
  updateProfile,
} from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/profile", getProfilePage);

router.get("/profile/edit", getEditProfilePage);

router.post("/profile/edit", updateProfile);

export default router;
