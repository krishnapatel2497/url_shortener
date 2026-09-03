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
      return total + (link.clicks || 0);
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

//edit

export const getEditProfilePage = async (req, res) => {
  try {
    // User must be logged in
    if (!req.user) {
      return res.redirect("/login");
    }

    const userId = new ObjectId(req.user.id);

    const user = await userCollection.findOne({
      _id: userId,
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.render("profile/edit-profile", {
      title: "Edit Profile",
      profileUser: user,
    });
  } catch (error) {
    console.error("Edit profile page error:", error);

    return res.status(500).send("Internal Server Error");
  }
};

//update

export const updateProfile = async (req, res) => {
  try {
    // User must be logged in
    if (!req.user) {
      return res.redirect("/login");
    }

    const userId = new ObjectId(req.user.id);

    const { name, email } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).send("Name and email are required");
    }

    await userCollection.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          name: name.trim(),
          email: email.trim(),
          updatedAt: new Date(),
        },
      },
    );

    return res.redirect("/profile");
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).send("Internal Server Error");
  }
};
