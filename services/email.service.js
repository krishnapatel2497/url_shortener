import  transporter  from "../config/mail.js";

export const sendVerificationEmail = async (
  email,
  verificationToken
) => {
  const verificationUrl =
    `http://localhost:3000/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email address",

    html: `
      <div>
        <h2>Verify Your Email</h2>

        <p>
          Thank you for registering.
          Please verify your email address by clicking the button below.
        </p>

        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          "
        >
          Verify Email
        </a>

        <p>
          This link will expire in 15 minutes.
        </p>
      </div>
    `,
  });
};