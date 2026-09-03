import { userCollection } from "../config/db-client.js";
import argon2 from "argon2";

import {
  loginUserSchema,
  registerUserSchema,
} from "../validators/auth-validators.js";

import { createAuthSession, setAuthCookies } from "../utils/auth.js";

import {
  deleteSession,
  getSessionById,
  updateSessionLastUsed,
} from "../models/session.model.js";

import {
  verifyRefreshToken,
  generateAccessToken,
  generateEmailVerificationCode,
  generateEmailVerificationToken,
  hashToken,
} from "../utils/token.js";

import { sendVerificationEmail } from "../services/email.service.js";

/*
|--------------------------------------------------------------------------
| GET REGISTER PAGE
|--------------------------------------------------------------------------
*/

export const getRegisterPage = (req, res) => {
  // If user is already logged in, don't show register page
  if (req.user) {
    return res.redirect("/");
  }

  return res.render("auth/register", {
    errors: req.flash("errors"),
  });
};

/*
|--------------------------------------------------------------------------
| POST REGISTER
|--------------------------------------------------------------------------
*/

export const postRegisterPage = async (req, res) => {
  // If user is already logged in
  if (req.user) {
    return res.redirect("/");
  }

  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Validate Registration Data
    |--------------------------------------------------------------------------
    */

    const { data, error } = registerUserSchema.safeParse(req.body);

    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/register");
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Get Validated Data
    |--------------------------------------------------------------------------
    */

    const { name, email, password } = data;

    /*
    |--------------------------------------------------------------------------
    | 3. Check Whether User Already Exists
    |--------------------------------------------------------------------------
    */

    const userExists = await userCollection.findOne({
      email,
    });

    if (userExists) {
      req.flash("errors", "User already exists");

      return res.redirect("/register");
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Hash Password Using Argon2
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await argon2.hash(password);

    /*
    |--------------------------------------------------------------------------
    | 5. Generate 8-Digit Verification Code
    |--------------------------------------------------------------------------
    */

    const verificationCode = generateEmailVerificationCode();

    /*
    |--------------------------------------------------------------------------
    | 6. Generate Verification Link Token
    |--------------------------------------------------------------------------
    */

    const verificationToken = generateEmailVerificationToken();

    /*
    |--------------------------------------------------------------------------
    | 7. Hash Verification Code
    |--------------------------------------------------------------------------
    |
    | We send the original code to the user,
    | but store only the hashed code in MongoDB.
    |
    |--------------------------------------------------------------------------
    */

    const hashedCode = hashToken(verificationCode);

    /*
    |--------------------------------------------------------------------------
    | 8. Hash Verification Link Token
    |--------------------------------------------------------------------------
    |
    | We send the original token in Gmail link,
    | but store only the hashed token in MongoDB.
    |
    |--------------------------------------------------------------------------
    */

    const hashedToken = hashToken(verificationToken);

    /*
    |--------------------------------------------------------------------------
    | 9. Set Verification Expiration
    |--------------------------------------------------------------------------
    |
    | Both code and link expire after 15 minutes.
    |
    |--------------------------------------------------------------------------
    */

    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    /*
    |--------------------------------------------------------------------------
    | 10. Store User in MongoDB
    |--------------------------------------------------------------------------
    */

    await userCollection.insertOne({
      name,
      email,
      password: hashedPassword,

      emailVerified: false,

      // Hashed 8-digit code
      emailVerificationCode: hashedCode,

      // Hashed link token
      emailVerificationToken: hashedToken,

      // Expiry for both
      emailVerificationExpires: verificationExpires,

      createdAt: new Date(),
    });

    /*
    |--------------------------------------------------------------------------
    | 11. Send Verification Email
    |--------------------------------------------------------------------------
    |
    | Send BOTH:
    |
    | 1. 8-digit verification code
    | 2. Clickable verification link
    |
    |--------------------------------------------------------------------------
    */

    await sendVerificationEmail(email, verificationCode, verificationToken);

    /*
    |--------------------------------------------------------------------------
    | 12. Don't Login User Yet
    |--------------------------------------------------------------------------
    |
    | User must verify email first.
    |
    |--------------------------------------------------------------------------
    */

    req.flash(
      "success",
      "Registration successful! Check your email to verify your account.",
    );

    /*
    |--------------------------------------------------------------------------
    | 13. Redirect to Verification Page
    |--------------------------------------------------------------------------
    */

    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Registration Error:", error);

    req.flash("errors", "Something went wrong. Please try again.");

    return res.redirect("/register");
  }
};

/*
|--------------------------------------------------------------------------
| GET LOGIN PAGE
|--------------------------------------------------------------------------
*/

export const getLoginPage = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  return res.render("auth/login", {
    errors: req.flash("errors"),
    success: req.flash("success"),
  });
};

/*
|--------------------------------------------------------------------------
| POST LOGIN
|--------------------------------------------------------------------------
*/

export const postLogin = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Validate Login Data
    |--------------------------------------------------------------------------
    */

    const { data, error } = loginUserSchema.safeParse(req.body);

    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Get Login Data
    |--------------------------------------------------------------------------
    */

    const { email, password } = data;

    /*
    |--------------------------------------------------------------------------
    | 3. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      email,
    });

    if (!user) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Verify Password
    |--------------------------------------------------------------------------
    */

    const isPasswordCorrect = await argon2.verify(user.password, password);

    if (!isPasswordCorrect) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Check Email Verification
    |--------------------------------------------------------------------------
    */

    if (!user.emailVerified) {
      req.flash("errors", "Please verify your email before logging in.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Create Authentication Session
    |--------------------------------------------------------------------------
    */

    const { accessToken, refreshToken } = await createAuthSession(user, req);

    /*
    |--------------------------------------------------------------------------
    | 7. Set Authentication Cookies
    |--------------------------------------------------------------------------
    */

    setAuthCookies(res, accessToken, refreshToken);

    /*
    |--------------------------------------------------------------------------
    | 8. Login Successful
    |--------------------------------------------------------------------------
    */

    return res.redirect("/");
  } catch (error) {
    console.error("Login Error:", error);

    req.flash("errors", "Something went wrong. Please try again.");

    return res.redirect("/login");
  }
};

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

export const getme = (req, res) => {
  if (!req.user) {
    return res.send("Not logged in");
  }

  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

/*
|--------------------------------------------------------------------------
| LOGOUT USER
|--------------------------------------------------------------------------
*/

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);

        await deleteSession(decoded.sessionId);
      } catch (error) {
        console.log("Refresh token already expired or invalid");
      }
    }

    res.clearCookie("access_token");

    res.clearCookie("refresh_token");

    return res.redirect("/login");
  } catch (error) {
    console.error(error);

    return res.redirect("/login");
  }
};

/*
|--------------------------------------------------------------------------
| REFRESH ACCESS TOKEN
|--------------------------------------------------------------------------
*/

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const sessionId = decoded.sessionId;

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(401).json({
        message: "Session expired or revoked",
      });
    }

    const refreshTokenHash = hashToken(refreshToken);

    if (refreshTokenHash !== session.refreshTokenHash) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const user = await userCollection.findOne({
      _id: session.userId,
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email is not verified",
      });
    }

    const newAccessToken = generateAccessToken(user, sessionId);

    await updateSessionLastUsed(sessionId);

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      message: "Access token refreshed",
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};
