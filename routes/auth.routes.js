import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";

const router = Router();

router.get("/register", authControllers.getRegisterPage); //getRegisterPage = controllers 
router.get("/login", authControllers.getLoginPage); //getLoginPage = controllers 

export const authRoutes = router;
