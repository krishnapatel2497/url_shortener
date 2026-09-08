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

// Update user password
export const updateUserPassword = async (userId, hashedPassword) => {
  return await userCollection.updateOne(
    {
      _id: new ObjectId(userId),
    },
    {
      $set: {
        password: hashedPassword,
      },
    },
  );
};
