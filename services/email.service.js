import transporter from "../config/mail.js";

export const sendVerificationEmail = async (email, verificationCode) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Verify your email address",

    html: `
      <div>
        <h2>Verify Your Email</h2>

        <p>
          Thank you for registering.
          Please use the verification code below
          to verify your email address.
        </p>

        <h1 style="letter-spacing: 8px;">
          ${verificationCode}
        </h1>

        <p>
          This link will expire in 15 minutes.
        </p>
      </div>
    `,
  });
};
