import { ObjectId } from "mongodb";
import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db = dbclient.db(env.MONGODB_DATABASE_NAME);

const shortenerCollection = db.collection("shorteners");

// Get all short URLs from MongoDB
export const loadLinks = async () => {
  return shortenerCollection.find().toArray();  //Find documents in the collection.
};

// Insert one new short URL into MongoDB
export const saveLinks = async (link) => {
  return shortenerCollection.insertOne(link);
};

// Find link using shortCode // Find a short URL //Search MongoDB
export const getLinkByShortCode = async (shortCode) => {
  return shortenerCollection.findOne({
    shortCode: shortCode,
  });
};

// Get only links created by a specific user //Get user's URLs
export const getLinksByUserId = async (userId) => {
  return shortenerCollection
    .find({
      userId: new ObjectId(userId),
    })
    .toArray();
};

//findShortLinkbyId  //Search MongoDB using userId
export const findShortLinkById = async (id, userId) => {
  return await shortenerCollection.findOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId),
  });
};

//updateShortLink //Edit a URL //Update MongoDB
export const updateShortLink = async (id, userId, data) => {
  return shortenerCollection.updateOne(
    {
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    },
    {
      $set: data,
    },
  );
};

//Delete a URL // Delete from MongoDB
export const deleteShortLink = async (id, userId) => {
  return shortenerCollection.deleteOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId),
  });
};
