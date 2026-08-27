import { ObjectId } from "mongodb";

import { userCollection } from "../config/db-client.js";

import { shortenerCollection } from "../models/shortener.model.js";

export const getProfilePage = async (req, res) => {
  try {
    // User must be logged in
    if (!req.user) {
      return res.redirect("/login");
    }

    // Get logged-in user's ID
    const userId = new ObjectId(req.user.id);

    // Find user from MongoDB
    const user = await userCollection.findOne({
      _id: userId,
    });

    // User not found
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Find user's shortened URLs
    const links = await shortenerCollection
      .find({
        userId: userId,
      })
      .toArray();

    // Count links
    const linksCreated = links.length;

    // Calculate total clicks
    const totalClicks = links.reduce((total, link) => {
      return total + (
        link.clicks || 0);
    }, 0);

    return res.render("profile/profile", {
      title: "My Profile",

      profileUser: user,

      linksCreated,

      totalClicks,

      lastActive: new Date(),
    });
  } catch (error) {
    console.error("Profile page error:", error);

    return res.status(500).send("Internal Server Error");
  }
};
