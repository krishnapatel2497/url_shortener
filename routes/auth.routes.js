import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";

const router = Router();

//router.get("/register", authControllers.getRegisterPage); //getRegisterPage = controllers

router
  .route("/register")
  .get(authControllers.getRegisterPage)
  .post(authControllers.postRegisterPage);

//router.get("/login", authControllers.getLoginPage); //getLoginPage = controllers
//router.post("/login", authControllers.postLogin);
//or
router
  .route("/login")
  .get(authControllers.getLoginPage)
  .post(authControllers.postLogin);

router.route("/me").get(authControllers.getme);

export const authRoutes = router;
