import { Router } from "express";
import {
  getShortenerPage,
  postURLShortener,
  redirectToShortLink,
} from "../controllers/postshortener.controller.js";

const router = Router(); //create router

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/:shortCode", redirectToShortLink);

//default export | short application
//export default router;

//Named exports
export const shortenerRoutes = router;
