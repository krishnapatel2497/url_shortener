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
---------------------------------------------------------------------------
generateRandomToken 
---------------------------------------------------------------------------
*/

// export const generateRandomToken = () => {
//   return crypto.randomBytes(32).toString("hex");
// };

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
| GENERATE 8-DIGIT EMAIL VERIFICATION CODE
|--------------------------------------------------------------------------
*/

export const generateEmailVerificationCode = () => {
  return crypto.randomInt(10000000, 100000000).toString();
};

/*
|---------------------------------------------------------------------------
| GENERATE EMAIL VERIFICATION LINK TOKEN
|---------------------------------------------------------------------------
*/

export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
/*
|--------------------------------------------------------------------------
| Hash Refresh Token
|--------------------------------------------------------------------------
*/

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
