import { userCollection } from "../config/db-client.js";
import { hashToken } from "../utils/token.js";

export const verifyEmail = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Get Verification Token From URL
    |--------------------------------------------------------------------------
    |
    | Example:
    | http://localhost:3000/verify-email?token=abc123
    |
    */

    const { token } = req.query;

    /*
    |--------------------------------------------------------------------------
    | 2. Check Token
    |--------------------------------------------------------------------------
    */

    if (!token) {
      return res.status(400).render("auth/verify-email", {
        title: "Email Verification",
        success: false,
        message: "Verification token is missing.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Hash Token
    |--------------------------------------------------------------------------
    | The original token is in the email URL.
    | MongoDB contains the hashed version.
    |
    */

    const hashedToken = hashToken(token);

    /*
    |--------------------------------------------------------------------------
    | 4. Find User
    |--------------------------------------------------------------------------
    */

    const user = await userCollection.findOne({
      emailVerificationToken: hashedToken,
    });

    /*
    |--------------------------------------------------------------------------
    | 5. Check Token Validity
    |--------------------------------------------------------------------------
    */

    if (!user) {
      return res.status(400).render("auth/verify-email", {
        title: "Email Verification",
        success: false,
        message: "Invalid or already used verification link.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Check Token Expiration
    |--------------------------------------------------------------------------
    */

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).render("auth/verify-email", {
        title: "Email Verification",
        success: false,
        message: "Your verification link has expired.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Verify Email
    |--------------------------------------------------------------------------
    */

    await userCollection.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          emailVerified: true,
        },

        /*
        |--------------------------------------------------------------------------
        | Remove Verification Token
        |--------------------------------------------------------------------------
        */

        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      },
    );

    /*
    |--------------------------------------------------------------------------
    | 8. Show success page/ Redirect to Login
    |--------------------------------------------------------------------------
    */

    return res.render("auth/verify-email", {
      title: "Email Verification",
      success: true,
      message: "Your email has been verified successfully!",
    });
  } catch (error) {
    console.error("Email Verification Error:", error);

    return res.status(500).render("auth/verify-email", {
      title: "Email Verification",
      success: false,
      message: "Something went wrong during email verification.",
    });
  }
};
