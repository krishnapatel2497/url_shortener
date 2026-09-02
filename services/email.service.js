import nodemailer from "nodemailer";

import transporter from "../config/mail.js";
import { env } from "../config/env.js";

// --------------------------------------------------
// SEND VERIFICATION EMAIL
// --------------------------------------------------

export const sendVerificationEmail = async (email, verificationCode) => {
  const info = await transporter.sendMail({
    from: `"URL Shortener" <${env.ETHEREAL_USER}>`,

    to: email,

    subject: "Verify Your Email",

    text: `
Your email verification code is:

${verificationCode}

This code will expire in 15 minutes.
`,

    html: `
      <div style="font-family: Arial, sans-serif;">

        <h2>Verify Your Email</h2>

        <p>
          Thank you for registering.
        </p>

        <p>
          Your email verification code is:
        </p>

        <h1 style="letter-spacing: 8px;">
          ${verificationCode}
        </h1>

        <p>
          This code will expire in
          <strong>15 minutes.</strong>
        </p>

      </div>
    `,
  });

  console.log("Verification email sent.");

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};

// --------------------------------------------------
// SEND TEST EMAIL
// --------------------------------------------------

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
