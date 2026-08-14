import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

{
  /*import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_FILE = path.join("data", "links.json");

export const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {    //Error NO ENTry
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
};

export const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links));
};
*/
}

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
