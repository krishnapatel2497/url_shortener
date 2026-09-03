import { ObjectId } from "mongodb";
import { userCollection } from "../config/db-client.js";

// Get user by ID
export const getUserById = async (userId) => {
  return await userCollection.findOne({
    _id: new ObjectId(userId),
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
