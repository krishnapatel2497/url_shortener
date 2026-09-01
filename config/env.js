import dotenv from "dotenv";

dotenv.config();

export const env = {
  MONGODB_URL: process.env.MONGODB_URL,

  MONGODB_DATABASE_NAME: process.env.MONGODB_DATABASE_NAME,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
};

// export const env1 = z
//   .object({
//     PORT: z.coerce.number().default(3000),
//     MONGODB_URL: z.string(),
//     MONGODB_DATABASE_NAME: z.string(),
//     JWT_ACCESS_SECRET: z.string(),
//     JWT_REFRESH_SECRET: z.string(),
//   })
//   .parse(process.env);
