import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "./token.js";

import { createSession } from "../models/session.model.js";

// Generate a unique session ID
export const generateSessionId = () => {
  return crypto.randomUUID();
};

// Set authentication cookies
export const setAuthCookies = (res, accessToken, refreshToken) => {
  // Access Token Cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh Token Cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// Create authentication session
export const createAuthSession = async (user, req) => {
  // 1. Generate unique session ID
  const sessionId = generateSessionId();

  // 2. Generate Access Token
  const accessToken = generateAccessToken(user, sessionId);

  // 3. Generate Refresh Token
  const refreshToken = generateRefreshToken(user, sessionId);

  // 4. Hash Refresh Token
  const refreshTokenHash = hashToken(refreshToken);

  // 5. Set session expiry
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 6. Save session in MongoDB
  await createSession({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    expiresAt,
  });

  // 7. Return tokens
  return {
    sessionId,
    accessToken,
    refreshToken,
  };
};
