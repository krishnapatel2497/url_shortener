import { ObjectId } from "mongodb";

import { userCollection } from "../config/db-client.js";

// Get user by ID
export const getUserById = async (userId) => {
  return await userCollection.findOne({
    _id: new ObjectId(userId),
  });
};

// Get user by email
export const getUserByEmail = async (email) => {
  return await userCollection.findOne({
    email: email.toLowerCase(),
  });
};

// Get user by Google ID
// Does a user with this Google ID already exist?
export const getUserByGoogleId = async (googleId) => {
  return await userCollection.findOne({
    googleId,
  });
};

// Create user from Google OAuth

export const createGoogleUser = async ({ name, email, googleId }) => {
  const user = {
    name,
    email: email.toLowerCase(),

    // Google users don't have a local password initially
    password: null,

    // This account was created through Google
    authProvider: "google",

    // Google's unique user ID
    googleId,

    // Google has already authenticated the email
    emailVerified: true,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await userCollection.insertOne(user);

  return {
    ...user,
    _id: result.insertedId,
  };
};

// Update user password
export const updateUserPassword = async (userId, hashedPassword) => {
  return await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password: hashedPassword } },
  );
};
