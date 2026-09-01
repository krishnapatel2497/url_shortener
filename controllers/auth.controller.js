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
  //generateRandomToken,
  generateEmailVerificationCode,
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

    // Validation failed
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
    | 5. Generate Email Verification Token
    |--------------------------------------------------------------------------
    */

    //const verificationToken = generateRandomToken();
    const verificationCode = generateEmailVerificationCode();

    /*
    |--------------------------------------------------------------------------
    | 6. Hash Verification Token
    |--------------------------------------------------------------------------
    |
    | We send the original token to the user,
    | but store only the hashed token in MongoDB.
    |
    */

    const hashedVerificationToken = hashToken(verificationCode);

    /*
    |--------------------------------------------------------------------------
    | 7. Set Token Expiration
    |--------------------------------------------------------------------------
    |
    | Verification link will expire after 15 minutes.
    |
    */

    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    /*
    |--------------------------------------------------------------------------
    | 8. Store User in MongoDB
    |--------------------------------------------------------------------------
    */

    await userCollection.insertOne({
      name,
      email,
      password: hashedPassword,

      // Email verification information
      emailVerified: false,
      emailVerificationCode: hashedVerificationToken,
      emailVerificationExpires,

      createdAt: new Date(),
    });

    /*
    |--------------------------------------------------------------------------
    | 9. Send Verification Email
    |--------------------------------------------------------------------------
    */

    await sendVerificationEmail(email, verificationCode);

    /*
    |--------------------------------------------------------------------------
    | 10. Don't Login User Yet
    |--------------------------------------------------------------------------
    |
    | User must verify email first.
    |
    */

    req.flash(
      "success",
      "Registration successful! Check your email for the 8-digit verification code.",
    );

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
  // If user is already logged in
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
  // If user is already logged in
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

    // Validation failed
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
    | 3. Find User by Email
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      email,
    });

    /*
    |--------------------------------------------------------------------------
    | 4. User Doesn't Exist
    |--------------------------------------------------------------------------
    */

    if (!user) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Verify Password
    |--------------------------------------------------------------------------
    */

    const isPasswordCorrect = await argon2.verify(user.password, password);

    /*
    |--------------------------------------------------------------------------
    | 6. Password Incorrect
    |--------------------------------------------------------------------------
    */

    if (!isPasswordCorrect) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Check Email Verification
    |--------------------------------------------------------------------------
    */

    if (!user.emailVerified) {
      req.flash("errors", "Please verify your email before logging in.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Create Authentication Session
    |--------------------------------------------------------------------------
    */

    const { accessToken, refreshToken } = await createAuthSession(user, req);

    /*
    |--------------------------------------------------------------------------
    | 9. Set Authentication Cookies
    |--------------------------------------------------------------------------
    */

    setAuthCookies(res, accessToken, refreshToken);

    /*
    |--------------------------------------------------------------------------
    | 10. Login Successful
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
  // User is not logged in
  if (!req.user) {
    return res.send("Not logged in");
  }

  // User is logged in
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

/*
|--------------------------------------------------------------------------
| LOGOUT USER
|--------------------------------------------------------------------------
*/

export const logoutUser = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Get Refresh Token
    |--------------------------------------------------------------------------
    */

    const refreshToken = req.cookies.refresh_token;

    /*
    |--------------------------------------------------------------------------
    | 2. Delete Session
    |--------------------------------------------------------------------------
    */

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);

        await deleteSession(decoded.sessionId);
      } catch (error) {
        console.log("Refresh token already expired or invalid");
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Clear Cookies
    |--------------------------------------------------------------------------
    */

    res.clearCookie("access_token");

    res.clearCookie("refresh_token");

    /*
    |--------------------------------------------------------------------------
    | 4. Redirect to Login
    |--------------------------------------------------------------------------
    */

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
    /*
    |--------------------------------------------------------------------------
    | 1. Get Refresh Token
    |--------------------------------------------------------------------------
    */

    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Verify Refresh Token
    |--------------------------------------------------------------------------
    */

    const decoded = verifyRefreshToken(refreshToken);

    /*
    |--------------------------------------------------------------------------
    | 3. Get Session ID
    |--------------------------------------------------------------------------
    */

    const sessionId = decoded.sessionId;

    /*
    |--------------------------------------------------------------------------
    | 4. Find Session
    |--------------------------------------------------------------------------
    */

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(401).json({
        message: "Session expired or revoked",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Hash Refresh Token
    |--------------------------------------------------------------------------
    */

    const refreshTokenHash = hashToken(refreshToken);

    /*
    |--------------------------------------------------------------------------
    | 6. Compare Refresh Token
    |--------------------------------------------------------------------------
    */

    if (refreshTokenHash !== session.refreshTokenHash) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      _id: session.userId,
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Check Email Verification
    |--------------------------------------------------------------------------
    */

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email is not verified",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 9. Generate New Access Token
    |--------------------------------------------------------------------------
    */

    const newAccessToken = generateAccessToken(user);

    /*
    |--------------------------------------------------------------------------
    | 10. Update Session
    |--------------------------------------------------------------------------
    */

    await updateSessionLastUsed(sessionId);

    /*
    |--------------------------------------------------------------------------
    | 11. Set New Access Token Cookie
    |--------------------------------------------------------------------------
    */

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    /*
    |--------------------------------------------------------------------------
    | 12. Send Response
    |--------------------------------------------------------------------------
    */

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
