import jwt from "jsonwebtoken";
import crypto from "crypto";

import { env } from "../config/env.js";

/*
|--------------------------------------------------------------------------
| Generate Access Token
|--------------------------------------------------------------------------
*/

export const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      sessionId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

/*
|--------------------------------------------------------------------------
| Generate Refresh Token
|--------------------------------------------------------------------------
*/

export const generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      sessionId,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );
};

/*
|--------------------------------------------------------------------------
| Verify Access Token
|--------------------------------------------------------------------------
*/

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/*
|--------------------------------------------------------------------------
| Verify Refresh Token
|--------------------------------------------------------------------------
*/

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

/*
|--------------------------------------------------------------------------
| Hash Refresh Token
|--------------------------------------------------------------------------
*/

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
