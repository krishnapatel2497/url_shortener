import { Router } from "express";

import {
  getShortenerEditPage,
  getShortenerPage,
  postDeleteShortener,
  postShortenerEditPage,
  postURLShortener,
  redirectToShortLink,
} from "../controllers/postshortener.controller.js";

import { verifyAuthentication } from "../middleware/auth.Middleware.js";

const router = Router();

// Home
router.get("/", verifyAuthentication, getShortenerPage);

// About
router.get("/about", (req, res) => {
  res.render("about", {
    title: "About - URL Shortener",
  });
});

// Contact
router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact - URL Shortener",
  });
});

// Create short URL
router.post("/", verifyAuthentication, postURLShortener);

// Edit short URL
router.get("/shortener/edit/:id", verifyAuthentication, getShortenerEditPage);

router.post("/shortener/edit/:id", verifyAuthentication, postShortenerEditPage);

// Delete short URL
router.post("/shortener/delete/:id", verifyAuthentication, postDeleteShortener);

// Redirect short URL
router.get("/:shortCode", redirectToShortLink);

// Named export
export const shortenerRoutes = router;
