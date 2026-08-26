import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db = dbclient.db(env.MONGODB_DATABASE_NAME);

const sessionCollection = db.collection("sessions");

//create a new session
export const createSession = async (sessionData) => {
  return await sessionCollection.insertOne({
    userId: sessionData.userId,
    sessionId: sessionData.sessionId, // Random session identifier
    refreshToken: sessionData.refreshToken, // Refresh token or its hash
    userAgent: sessionData.userAgent || null, // Device/browser information
    ipAddress: sessionData.ipAddress || null, // IP address
    createdAt: new Date(), // Session creation time
    expiresAt: sessionData.expiresAt, // Session expiry time
    isActive: true, // Whether session is still active
  });
};

// Find session by sessionId
export const getSessionById = async (sessionId) => {
  return sessionCollection.findOne({
    sessionId,
    isActive: true,
  });
};

// Delete / deactivate session
export const deleteSession = async (sessionId) => {
  return sessionCollection.updateOne(
    { sessionId },
    { $set: { isActive: false, revokedAt: new Date() } },
  );
};

// Delete all sessions of a user
export const deleteAllUserSessions = async (userId) => {
  return sessionCollection.updateMany(
    { userId },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
      },
    },
  );
};
