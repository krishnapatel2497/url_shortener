import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: env.ETHEREAL_HOST,

  port: Number(env.ETHEREAL_PORT),

  secure: false,

  auth: {
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS,
  },
});

export default transporter;
