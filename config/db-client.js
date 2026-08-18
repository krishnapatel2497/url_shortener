import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

export const dbclient = new MongoClient(env.MONGODB_URL);

const db = dbclient.db(env.MONGODB_DATABASE_NAME)
export const userCollection = db.collection("users");
