import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";

const router = Router();

router.get("/register", authControllers.getRegisterPage); //getRegisterPage = controllers hai
router.get("/login", authControllers.getLoginPage); //getLoginPage = controllers hai...

export const authRoutes = router;
