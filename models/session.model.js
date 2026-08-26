import { dbclient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db = dbclient.db(env.MONGODB_DATABASE_NAME);

const sessionCollection = db.collection("sessions");

// Create a new session
export const createSession = async (sessionData) => {
  return await sessionCollection.insertOne({
    userId: sessionData.userId,

    sessionId: sessionData.sessionId,

    // Store only the hashed refresh token
    refreshTokenHash: sessionData.refreshTokenHash,

    userAgent: sessionData.userAgent || null,

    ipAddress: sessionData.ipAddress || null,

    createdAt: new Date(),

    expiresAt: sessionData.expiresAt,

    lastUsedAt: new Date(),

    isActive: true,

    revokedAt: null,
  });
};

// Find active session by session ID
export const getSessionById = async (sessionId) => {
  return await sessionCollection.findOne({
    sessionId,
    isActive: true,
  });
};

// Update session last used time
export const updateSessionLastUsed = async (sessionId) => {
  return await sessionCollection.updateOne(
    {
      sessionId,
      isActive: true,
    },
    {
      $set: {
        lastUsedAt: new Date(),
      },
    },
  );
};

// Logout / revoke one session
export const deleteSession = async (sessionId) => {
  return await sessionCollection.updateOne(
    {
      sessionId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
      },
    },
  );
};

// Logout all sessions of a user
export const deleteAllUserSessions = async (userId) => {
  return await sessionCollection.updateMany(
    {
      userId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
      },
    },
  );
};
