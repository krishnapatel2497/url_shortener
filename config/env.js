import dotenv from "dotenv";

dotenv.config();

export const env = {
  APP_URL: process.env.APP_URL,

  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_DATABASE_NAME: process.env.MONGODB_DATABASE_NAME,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,

  ETHEREAL_HOST: process.env.ETHEREAL_HOST,
  ETHEREAL_PORT: process.env.ETHEREAL_PORT,
  ETHEREAL_USER: process.env.ETHEREAL_USER,
  ETHEREAL_PASS: process.env.ETHEREAL_PASS,

  // // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, //Identifies your application to Google
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET, //Proves that your backend is allowed to use the Google OAuth service
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL, //Where Google sends the user back after successful authentication
};
