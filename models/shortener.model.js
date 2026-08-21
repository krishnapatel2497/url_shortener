import { ObjectId } from "mongodb";
import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db = dbclient.db(env.MONGODB_DATABASE_NAME);

const shortenerCollection = db.collection("shorteners");

// Get all links
export const loadLinks = async () => {
  return shortenerCollection.find().toArray();
};


// Save a new link
export const saveLinks = async (link) => {
  return shortenerCollection.insertOne(link);
};


// Find link using shortCode
export const getLinkByShortCode = async (shortCode) => {
  return shortenerCollection.findOne({
    shortCode: shortCode,
  });
};


// Get only links created by a specific user
export const getLinksByUserId = async (userId) => {
  return shortenerCollection
    .find({
      userId: new ObjectId(userId),
    })
    .toArray();
};