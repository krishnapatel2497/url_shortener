import crypto from "crypto";
import { ObjectId } from "mongodb";

import {
  getLinkByShortCode,
  getLinksByUserId,
  saveLinks,
} from "../models/shortener.model.js";

// Show only the logged-in user's short links
export const getShortenerPage = async (req, res) => {
  try {
    // User must be logged in
    if (!req.user) {
      return res.redirect("/login");
    }

    // Get only links created by this user
    const links = await getLinksByUserId(req.user.id);

    return res.render("index", {
      links,
      host: req.host,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

// Create a new short link
export const postURLShortener = async (req, res) => {
  try {
    // User must be logged in
    if (!req.user) {
      return res.redirect("/login");
    }

    const { url, shortCode } = req.body;

    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // Check whether short code already exists
    const existingLink = await getLinkByShortCode(finalShortCode);

    if (existingLink) {
      return res
        .status(400)
        .send("400 - Short code already exists. Please choose another.");
    }

    // Save the link with the logged-in user's ID
    await saveLinks({
      url,
      shortCode: finalShortCode,
      userId: new ObjectId(req.user.id),
    });

    return res.redirect("/?success=true");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

// Redirect short URL to original URL
export const redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      return res.status(404).send("404 - Short URL not found");
    }

    return res.redirect(link.url);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};
