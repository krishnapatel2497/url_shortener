import crypto from "crypto";
import { ObjectId } from "mongodb";

import {
  deleteShortLink,
  findShortLinkById,
  getLinkByShortCode,
  getLinksByUserId,
  saveLinks,
  updateShortLink,
} from "../models/shortener.model.js";
import { shortenerSchema } from "../validators/shortener-validators.js";

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
      host: `${req.protocol}://${req.get("host")}`,
      errors: req.flash("errors"),
      success: req.flash("success"),
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

    // Validate form data using Zod
    const { data, error } = shortenerSchema.safeParse(req.body);

    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/");
    }

    // Get validated data
    const { url, shortCode } = data;

    // Generate random short code if user doesn't provide one
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex"); //shortCode is now required this is no longer necessary : crypto.randomBytes(4).toString("hex");

    // Check whether short code already exists
    const existingLink = await getLinkByShortCode(finalShortCode);

    if (existingLink) {
      req.flash("errors", "Short code already exists. Please choose another.");
      return res.redirect("/");
    }

    // Save the link with the logged-in user's ID
    await saveLinks({
      url,
      shortCode: finalShortCode,
      userId: new ObjectId(req.user.id),
    });

    req.flash("success", "Short URL created successfully");

    return res.redirect("/");
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

//getShortenerEditPage  // Show edit page
export const getShortenerEditPage = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.redirect("/404");
  }

  try {
    const shortLink = await findShortLinkById(id, req.user.id);

    if (!shortLink) {
      return res.redirect("/404");
    }

    return res.render("shortener/edit", {
      shortLink,
      errors: req.flash("errors"),
      success: req.flash("success"),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error.");
  }
};

// Update short URL
export const postShortenerEditPage = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.redirect("/404");
    }

    // Validate edited data
    const { data, error } = shortenerSchema.safeParse(req.body);

    if (error) {
      req.flash("errors", error.issues[0].message);
      return res.redirect(`/shortener/edit/${id}`);
    }

    const { url, shortCode } = data;

    // Check if shortCode already belongs to another link
    const existingLink = await getLinkByShortCode(shortCode);

    if (existingLink && existingLink._id.toString() !== id) {
      req.flash("errors", "Short code already exists. Please choose another.");

      return res.redirect(`/shortener/edit/${id}`);
    }

    // Update only the logged-in user's link
    const result = await updateShortLink(id, req.user.id, {
      url,
      shortCode,
    });

    if (result.matchedCount === 0) {
      return res.redirect("/404");
    }

    req.flash("success", "Short URL updated successfully");

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

//delete
export const postDeleteShortener = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.redirect("/404");
    }

    const result = await deleteShortLink(id, req.user.id);

    if (result.deletedCount === 0) {
      return res.redirect("/404");
    }

    req.flash("success", "Short URL deleted successfully");

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};
