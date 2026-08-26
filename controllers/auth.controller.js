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
  hashToken,
} from "../utils/token.js";

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
    // Validate registration data using Zod
    const { data, error } = registerUserSchema.safeParse(req.body);

    // Validation failed
    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/register");
    }

    // Get validated data
    const { name, email, password } = data;

    // Check whether user already exists
    const userExists = await userCollection.findOne({
      email: email,
    });

    if (userExists) {
      req.flash("errors", "User already exists");

      return res.redirect("/register");
    }

    // Hash password using Argon2
    const hashedPassword = await argon2.hash(password);

    // Store user in MongoDB
    const result = await userCollection.insertOne({
      name,
      email,
      password: hashedPassword,
    });

    // Create user object
    // Don't put password inside this object
    const user = {
      _id: result.insertedId,
      name,
      email,
    };

    // Create authentication session
    const { accessToken, refreshToken } = await createAuthSession(user, req);

    // Set authentication cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Redirect after successful registration
    return res.redirect("/");
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
    // Validate login data using Zod
    const { data, error } = loginUserSchema.safeParse(req.body);

    // Validation failed
    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/login");
    }

    // Get validated data
    const { email, password } = data;

    // Find user by email
    const user = await userCollection.findOne({
      email: email,
    });

    // User doesn't exist
    if (!user) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    // Compare entered password with Argon2 hash
    const isPasswordCorrect = await argon2.verify(user.password, password);

    // Password is incorrect
    if (!isPasswordCorrect) {
      req.flash("errors", "Invalid Email or Password");

      return res.redirect("/login");
    }

    // Create authentication session
    const { accessToken, refreshToken } = await createAuthSession(user, req);

    // Set access token and refresh token cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Login successful
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

//Refresh Controller

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

    const newAccessToken = generateAccessToken(user);

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
