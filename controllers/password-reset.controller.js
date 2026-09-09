import argon2 from "argon2";

import { env } from "../config/env.js";

import { generatePasswordResetToken, hashToken } from "../utils/token.js";

import {
  createPasswordReset,
  getPasswordResetByTokenHash,
  deletePasswordReset,
  deleteUserPasswordResets,
} from "../models/password-reset.model.js";

import {
  getUserByEmail,
  getUserById,
  updateUserPassword,
} from "../models/user.model.js";

import { sendPasswordResetEmail } from "../services/email.service.js";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/password-reset.validator.js";

//Show Forgot Password Page

export async function showForgotPassword(req, res) {
  return res.render("auth/forgot-password", {
    error: null,
    success: null,
  });
}

//Forgot Password

export async function forgotPassword(req, res) {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.render("auth/forgot-password", {
        error: result.error.issues[0].message,
        success: null,
      });
    }

    const { email } = result.data;

    const user = await getUserByEmail(email);

    //Don't reveal whether an email exists.

    if (!user) {
      return res.render("auth/forgot-password", {
        error: null,
        success:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    //Delete previous reset tokens
    await deleteUserPasswordResets(user._id);

    // Generate plain reset token
    const token = generatePasswordResetToken();

    //Store only hashed token in database
    const tokenHash = hashToken(token);

    //Token expires after 15 minutes

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    //Save reset information
    await createPasswordReset({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    //Create password reset URL
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;

    //Send reset email
    await sendPasswordResetEmail({
      email: user.email,
      resetUrl,
    });

    return res.render("auth/forgot-password", {
      error: null,
      success:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.render("auth/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
}

//Show Reset Password Page

export async function showResetPassword(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.render("auth/reset-password", {
        error: "Invalid or missing reset token.",
        token: null,
      });
    }

    //Hash token received from URL
    const tokenHash = hashToken(token);

    // Find valid token
    const resetRequest = await getPasswordResetByTokenHash(tokenHash);

    if (!resetRequest) {
      return res.render("auth/reset-password", {
        error: "This password reset link is invalid or has expired.",
        token: null,
      });
    }

    //Token is valid
    return res.render("auth/reset-password", {
      error: null,
      token,
    });
  } catch (error) {
    console.error("Show Reset Password Error:", error);

    return res.render("auth/reset-password", {
      error: "Something went wrong.",
      token: null,
    });
  }
}

//Reset Password

export async function resetPassword(req, res) {
  try {
    const result = resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.render("auth/reset-password", {
        error: result.error.issues[0].message,
        token: req.body.token,
      });
    }

    const { token, password } = result.data;

    // Hash token from form
    const tokenHash = hashToken(token);

    //Find valid reset token
    const resetRequest = await getPasswordResetByTokenHash(tokenHash);

    if (!resetRequest) {
      return res.render("auth/reset-password", {
        error: "This password reset link is invalid or has expired.",
        token: null,
      });
    }

    // Ge
    const user = await getUserById(resetRequest.userId);

    if (!user) {
      return res.render("auth/reset-password", {
        error: "User account not found.",
        token: null,
      });
    }

    //Hash new password
    const hashedPassword = await argon2.hash(password);

    //Update password
    await updateUserPassword(user._id, hashedPassword);

    //Delete used reset token
    await deletePasswordReset(tokenHash);

    /*
     * Optional but recommended:
     * Invalidate all existing login sessions
     */
    // await deleteAllUserSessions(user._id);

    return res.redirect("/login?passwordReset=success");
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.render("auth/reset-password", {
      error: "Unable to reset password. Please try again.",
      token: req.body.token,
    });
  }
}
