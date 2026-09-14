import { userCollection } from "../config/db-client.js";

import { hashToken } from "../utils/token.js";

//GET VERIFY EMAIL PAGE

export const getVerifyEmailPage = (req, res) => {
  const { email } = req.query;

  // If Email Is Not Available

  if (!email) {
    return res.redirect("/register");
  }

  return res.render("auth/verify-email", {
    title: "Verify Email",
    email,
  });
};

//POST VERIFY EMAIL USING 8-DIGIT CODE

export const verifyEmail = async (req, res) => {
  try {
    //1. Get Email and Code

    const { email, code } = req.body;

    //2. Validate Input

    if (!email || !code) {
      return res.status(400).render("auth/verify-email", {
        title: "Verify Email",
        email,
        error: "Email and verification code are required.",
      });
    }

    //3. Validate 8-Digit Code

    if (!/^\d{8}$/.test(code)) {
      return res.status(400).render("auth/verify-email", {
        title: "Verify Email",
        email,
        error: "Verification code must be exactly 8 digits.",
      });
    }

    //4. Find User

    const user = await userCollection.findOne({
      email,
    });

    if (!user) {
      return res.status(400).render("auth/verify-email", {
        title: "Verify Email",
        email,
        error: "User not found.",
      });
    }

    //5. Check Already Verified

    if (user.emailVerified) {
      return res.redirect("/login");
    }

    //6. Check Expiry

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).render("auth/verify-email", {
        title: "Verify Email",
        email,
        error: "Verification code has expired. Please request a new code.",
      });
    }

    //7. Hash Entered Code

    const hashedCode = hashToken(code);

    //8. Compare Code

    if (hashedCode !== user.emailVerificationCode) {
      return res.status(400).render("auth/verify-email", {
        title: "Verify Email",
        email,
        error: "Invalid verification code.",
      });
    }

    //9. Mark Email as Verified

    await userCollection.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          emailVerified: true,
        },

        //Remove Verification Data

        $unset: {
          emailVerificationCode: "",
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      },
    );

    //10. Success

    req.flash("success", "Email verified successfully! You can now login.");

    return res.redirect("/login");
  } catch (error) {
    console.error("Email Verification Error:", error);

    return res
      .status(500)
      .send("Something went wrong during email verification.");
  }
};

//GET VERIFY EMAIL BY GMAIL LINK

export const verifyEmailByLink = async (req, res) => {
  try {
    //1. Get Token From URL

    const { token } = req.query;

    //2. Validate Token

    if (!token) {
      return res.status(400).send("Invalid verification link.");
    }

    //3. Hash Token

    const hashedToken = hashToken(token);

    //4. Find User Using Hashed Token

    const user = await userCollection.findOne({
      emailVerificationToken: hashedToken,
    });

    //5. Token Not Found

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    //6. Check Already Verified

    if (user.emailVerified) {
      return res.redirect("/login");
    }

    //7. Check Token Expiry

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res
        .status(400)
        .send(
          "Verification link has expired. Please request a new verification link.",
        );
    }

    //8. Mark Email as Verified

    await userCollection.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          emailVerified: true,
        },

        //Remove Verification Data

        $unset: {
          emailVerificationCode: "",
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      },
    );

    //9. Success

    req.flash("success", "Email verified successfully! You can now login.");

    return res.redirect("/login");
  } catch (error) {
    console.error("Email Link Verification Error:", error);

    return res
      .status(500)
      .send("Something went wrong during email verification.");
  }
};
