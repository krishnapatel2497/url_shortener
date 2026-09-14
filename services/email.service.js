import nodemailer from "nodemailer";

import transporter from "../config/mail.js";
import { env } from "../config/env.js";

// SEND VERIFICATION EMAIL

export const sendVerificationEmail = async (
  email,
  verificationCode,
  verificationToken,
) => {
  //Create Verification URL

  const verificationUrl = new URL(
    "/verify-email/link",
    env.APP_URL || "http://localhost:3000",
  );

  verificationUrl.searchParams.set("token", verificationToken);

  //Send Email

  const info = await transporter.sendMail({
    from: `"URL Shortener" <${env.ETHEREAL_USER}>`,

    to: email,

    subject: "Verify Your Email",

    //Plain Text Email

    text: `
Thank you for registering with URL Shortener.

Your email verification code is:

${verificationCode}

You can also verify your email by clicking this link:

${verificationUrl.toString()}

This code and verification link will expire in 15 minutes.
`,

    //HTML Email

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        "
      >

        <h2>Verify Your Email</h2>

        <p>
          Thank you for registering with
          <strong>URL Shortener</strong>.
        </p>

        <p>
          Your email verification code is:
        </p>

        <h1
          style="
            letter-spacing: 8px;
            background: #f4f4f4;
            padding: 15px;
            text-align: center;
          "
        >
          ${verificationCode}
        </h1>

        <p>
          Or you can verify your email by clicking the button below:
        </p>

        <div style="margin: 25px 0;">

          <a
            href="${verificationUrl.toString()}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Verify Email
          </a>

        </div>

        <p>
          This verification code and link will expire in
          <strong>15 minutes.</strong>
        </p>

        <p>
          If you did not create this account, you can safely ignore
          this email.
        </p>

      </div>
    `,
  });

  console.log("Verification email sent.");

  console.log("Verification URL:", verificationUrl.toString());

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};

// SEND PASSWORD RESET EMAIL

export const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  const info = await transporter.sendMail({
    from: `"URL Shortener" <${env.ETHEREAL_USER}>`,

    to: email,

    subject: "Reset Your Password",

    // Plain Text Email

    text: `
You requested to reset your password for URL Shortener.

Click the link below to reset your password:

${resetUrl}

This password reset link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.
`,

    // HTML Email

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        "
      >

        <h2>Reset Your Password</h2>

        <p>
          You requested to reset your password for
          <strong>URL Shortener</strong>.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <div style="margin: 25px 0;">

          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Reset Password
          </a>

        </div>

        <p>
          Or copy and paste this link into your browser:
        </p>

        <p>
          ${resetUrl}
        </p>

        <p>
          This password reset link will expire in
          <strong>15 minutes.</strong>
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

      </div>
    `,
  });

  console.log("Password reset email sent.");

  console.log("Password Reset URL:", resetUrl);

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};

// SEND TEST EMAIL

export const sendTestEmail = async () => {
  const info = await transporter.sendMail({
    from: `"URL Shortener" <${env.ETHEREAL_USER}>`,

    to: "test@example.com",

    subject: "Test Email from Node.js",

    text: `
Hello!

This is a test email sent using
Nodemailer and Ethereal.
`,

    html: `
      <h1>Hello!</h1>

      <p>
        This is a test email sent using
        <strong>Nodemailer</strong>
        and
        <strong>Ethereal</strong>.
      </p>
    `,
  });

  console.log("Test email sent.");

  console.log("Message ID:", info.messageId);

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};
