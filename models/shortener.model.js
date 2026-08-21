import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db = dbclient.db(env.MONGODB_DATABASE_NAME);
const shortenerCollection = db.collection("shorteners");

export const loadLinks = async () => {
  return shortenerCollection.find().toArray();
};

export const saveLinks = async (link) => {
  return shortenerCollection.insertOne(link);
};

export const getLinkByShortCode = async (shortCode) => {
  return await shortenerCollection.findOne({ shortCode: shortCode });
};
