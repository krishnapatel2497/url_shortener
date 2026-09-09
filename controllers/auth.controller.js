import { userCollection } from "../config/db-client.js";
import argon2 from "argon2";
import { ObjectId } from "mongodb";

import { env } from "../config/env.js";
import { googleOAuthClient } from "../config/google-oauth.js";

import {
  loginUserSchema,
  registerUserSchema,
  changePasswordSchema,
} from "../validators/auth-validators.js";

import { createAuthSession, setAuthCookies } from "../utils/auth.js";

import {
  deleteAllUserSessions,
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

//GET REGISTER PAGE

export const getRegisterPage = (req, res) => {
  // If user is already logged in, don't show register page
  if (req.user) {
    return res.redirect("/");
  }

  return res.render("auth/register", {
    errors: req.flash("errors"),
  });
};

//POST REGISTER

export const postRegisterPage = async (req, res) => {
  // If user is already logged in
  if (req.user) {
    return res.redirect("/");
  }

  try {
    // 1. Validate Registration Data

    const { data, error } = registerUserSchema.safeParse(req.body);

    if (error) {
      const errors = error.issues[0].message;

      req.flash("errors", errors);

      return res.redirect("/register");
    }

    //2. Get Validated Data

    const { name, email, password } = data;

    //3. Check Whether User Already Exists

    const userExists = await userCollection.findOne({
      email,
    });

    if (userExists) {
      req.flash("errors", "User already exists");

      return res.redirect("/register");
    }

    //4. Hash Password Using Argon2

    const hashedPassword = await argon2.hash(password);

    //5. Generate 8-Digit Verification Code

    const verificationCode = generateEmailVerificationCode();

    //6. Generate Verification Link Token

    const verificationToken = generateEmailVerificationToken();

    //7. Hash Verification Code

    const hashedCode = hashToken(verificationCode);

    //8. Hash Verification Link Token

    const hashedToken = hashToken(verificationToken);

    //9. Set Verification Expiration

    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    //10. Store User in MongoDB

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

    //11. Send Verification Email

    await sendVerificationEmail(email, verificationCode, verificationToken);

    //12. Don't Login User Yet

    req.flash(
      "success",
      "Registration successful! Check your email to verify your account.",
    );

    //13. Redirect to Verification Page

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
    | Google-only Account Check
    |--------------------------------------------------------------------------
    */

    if (!user.password) {
      req.flash(
        "errors",
        "This account does not have a password. Please login with Google.",
      );

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
| GOOGLE LOGIN
|--------------------------------------------------------------------------
|
| Step 1:
| User clicks "Continue with Google"
|
| /google
|
| This function creates Google's authorization URL
| and redirects the user to Google.
|
|--------------------------------------------------------------------------
*/

export const googleLogin = (req, res) => {
  try {
    const authorizationUrl = googleOAuthClient.generateAuthUrl({
      access_type: "offline",

      scope: ["openid", "email", "profile"],

      prompt: "select_account",
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google Login Error:", error);

    req.flash("errors", "Unable to login with Google. Please try again.");

    return res.redirect("/login");
  }
};

/*
|--------------------------------------------------------------------------
| GOOGLE CALLBACK
|--------------------------------------------------------------------------
|
| Step 2:
|
| Google redirects the user to:
|
| /google/callback
|
| Then we:
|
| 1. Get authorization code
| 2. Exchange code for Google tokens
| 3. Verify Google ID token
| 4. Get Google user information
| 5. Find or create user in MongoDB
| 6. Create our application's session
| 7. Set JWT cookies
| 8. Redirect to home page
|
|--------------------------------------------------------------------------
*/

export const googleCallback = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Get Authorization Code
    |--------------------------------------------------------------------------
    */

    const { code } = req.query;

    if (!code) {
      req.flash("errors", "Google authentication failed.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Exchange Authorization Code for Google Tokens
    |--------------------------------------------------------------------------
    */

    const { tokens } = await googleOAuthClient.getToken(code);

    /*
    |--------------------------------------------------------------------------
    | 3. Check ID Token
    |--------------------------------------------------------------------------
    */

    if (!tokens.id_token) {
      req.flash("errors", "Google authentication failed.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Verify Google ID Token
    |--------------------------------------------------------------------------
    */

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    /*
    |--------------------------------------------------------------------------
    | 5. Get Google User Information
    |--------------------------------------------------------------------------
    */

    const payload = ticket.getPayload();

    if (!payload) {
      req.flash("errors", "Unable to get Google account information.");

      return res.redirect("/login");
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const emailVerified = payload.email_verified;

    /*
    |--------------------------------------------------------------------------
    | 6. Validate Google Account Information
    |--------------------------------------------------------------------------
    */

    if (!googleId || !email) {
      req.flash("errors", "Unable to get Google account information.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | Make Sure Google Email Is Verified
    |--------------------------------------------------------------------------
    */

    if (!emailVerified) {
      req.flash("errors", "Your Google email is not verified.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Find Existing User
    |--------------------------------------------------------------------------
    */

    let user = await userCollection.findOne({
      email,
    });

    /*
    |--------------------------------------------------------------------------
    | 8. Create New User
    |--------------------------------------------------------------------------
    */

    if (!user) {
      const newUser = {
        name: name || "Google User",
        email,
        password: null,

        googleId,
        picture: picture || null,

        // Google has already verified the email
        emailVerified: true,

        createdAt: new Date(),
      };

      const result = await userCollection.insertOne(newUser);

      user = {
        _id: result.insertedId,
        ...newUser,
      };
    } else {
      /*
      |--------------------------------------------------------------------------
      | 9. Existing User
      |--------------------------------------------------------------------------
      |
      | If the user already exists with the same email,
      | connect their Google account to the existing account.
      |
      |--------------------------------------------------------------------------
      */

      const updateData = {
        googleId,
        emailVerified: true,
        updatedAt: new Date(),
      };

      if (picture) {
        updateData.picture = picture;
      }

      await userCollection.updateOne(
        {
          _id: user._id,
        },
        {
          $set: updateData,
        },
      );

      user = {
        ...user,
        ...updateData,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | 10. Create Authentication Session
    |--------------------------------------------------------------------------
    |
    | Google authentication is now complete.
    |
    | We use the SAME session system as normal login.
    |
    |--------------------------------------------------------------------------
    */

    const { accessToken, refreshToken } = await createAuthSession(user, req);

    /*
    |--------------------------------------------------------------------------
    | 11. Set Authentication Cookies
    |--------------------------------------------------------------------------
    */

    setAuthCookies(res, accessToken, refreshToken);

    /*
    |--------------------------------------------------------------------------
    | 12. Google Login Successful
    |--------------------------------------------------------------------------
    */

    return res.redirect("/");
  } catch (error) {
    console.error("Google Callback Error:", error);

    req.flash("errors", "Google login failed. Please try again.");

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
| CHANGE PASSWORD PAGE
|--------------------------------------------------------------------------
*/

// Show Change Password Page
export const changePasswordPage = (req, res) => {
  res.render("auth/change-password");
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Validate Request Body
    |--------------------------------------------------------------------------
    */

    const result = changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const { currentPassword, newPassword } = result.data;

    /*
    |--------------------------------------------------------------------------
    | 2. Get Logged-In User ID
    |--------------------------------------------------------------------------
    */

    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | 3. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Check Password Exists
    |--------------------------------------------------------------------------
    |
    | Google-only users don't have a password.
    |
    |--------------------------------------------------------------------------
    */

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google login and does not have a password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Verify Current Password
    |--------------------------------------------------------------------------
    */

    const isPasswordValid = await argon2.verify(user.password, currentPassword);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Hash New Password
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await argon2.hash(newPassword);

    /*
    |--------------------------------------------------------------------------
    | 7. Update Password
    |--------------------------------------------------------------------------
    */

    await userCollection.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    /*
    |--------------------------------------------------------------------------
    | 8. Revoke All Existing Sessions
    |--------------------------------------------------------------------------
    */

    await deleteAllUserSessions(userId);

    /*
    |--------------------------------------------------------------------------
    | 9. Clear Authentication Cookies
    |--------------------------------------------------------------------------
    */

    res.clearCookie("access_token");

    res.clearCookie("refresh_token");

    /*
    |--------------------------------------------------------------------------
    | 10. Redirect to Login
    |--------------------------------------------------------------------------
    */

    return res.redirect("/login");
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| SET PASSWORD PAGE
|--------------------------------------------------------------------------
*/

// Show Set Password Page
export const setPasswordPage = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Get Logged-In User ID
    |--------------------------------------------------------------------------
    */

    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | 2. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      req.flash("errors", "User not found.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Check Whether Password Already Exists
    |--------------------------------------------------------------------------
    |
    | Set Password is ONLY for users who don't have a password.
    |
    */

    if (user.password) {
      req.flash("errors", "You already have a password.");

      return res.redirect("/");
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Show Set Password Page
    |--------------------------------------------------------------------------
    */

    return res.render("auth/set-password", {
      errors: req.flash("errors"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Set Password Page Error:", error);

    req.flash("errors", "Unable to open set password page.");

    return res.redirect("/");
  }
};

// Set Password
export const setPassword = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Get Password Data
    |--------------------------------------------------------------------------
    */

    const { password, confirmPassword } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 2. Check Password Fields
    |--------------------------------------------------------------------------
    */

    if (!password || !confirmPassword) {
      req.flash("errors", "Please enter both password fields.");

      return res.redirect("/set-password");
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Check Password Length
    |--------------------------------------------------------------------------
    */

    if (password.length < 6) {
      req.flash("errors", "Password must be at least 6 characters long.");

      return res.redirect("/set-password");
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Check Password Confirmation
    |--------------------------------------------------------------------------
    */

    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match.");

      return res.redirect("/set-password");
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Get Logged-In User ID
    |--------------------------------------------------------------------------
    */

    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | 6. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      req.flash("errors", "User not found.");

      return res.redirect("/login");
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Make Sure User Doesn't Already Have a Password
    |--------------------------------------------------------------------------
    */

    if (user.password) {
      req.flash("errors", "You already have a password.");

      return res.redirect("/");
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Hash Password Using Argon2
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await argon2.hash(password);

    /*
    |--------------------------------------------------------------------------
    | 9. Save Password in MongoDB
    |--------------------------------------------------------------------------
    */

    await userCollection.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    /*
    |--------------------------------------------------------------------------
    | 10. Success
    |--------------------------------------------------------------------------
    */

    req.flash(
      "success",
      "Password set successfully. You can now login with your email and password.",
    );

    return res.redirect("/");
  } catch (error) {
    console.error("Set Password Error:", error);

    req.flash("errors", "Unable to set password. Please try again.");

    return res.redirect("/set-password");
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

    const sessionId = decoded.sessionId;

    /*
    |--------------------------------------------------------------------------
    | 3. Find Session
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
    | 4. Compare Refresh Token Hash
    |--------------------------------------------------------------------------
    */

    const refreshTokenHash = hashToken(refreshToken);

    if (refreshTokenHash !== session.refreshTokenHash) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Find User
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
    | 6. Check Email Verification
    |--------------------------------------------------------------------------
    */

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email is not verified",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Generate New Access Token
    |--------------------------------------------------------------------------
    */

    const newAccessToken = generateAccessToken(user, sessionId);

    /*
    |--------------------------------------------------------------------------
    | 8. Update Session Last Used
    |--------------------------------------------------------------------------
    */

    await updateSessionLastUsed(sessionId);

    /*
    |--------------------------------------------------------------------------
    | 9. Set New Access Token Cookie
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
    | 10. Response
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
