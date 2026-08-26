import { userCollection } from "../config/db-client.js";
//import bcrypt from "bcrypt";
import argon2 from "argon2";
//import { generateToken } from "../utils/generateToken.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validators/auth-validators.js";
import { createSession } from "../models/session.model.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/register", { errors: req.flash("errors") }); //auth folder-page:register
};

export const postRegisterPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  // Validate registration data using Zod
  const { data, error } = registerUserSchema.safeParse(req.body);

  if (error) {
    const errors = error.issues[0].message;
    req.flash("errors", errors);
    return res.redirect("/register");
  }

  // Get validated data
  const { name, email, password } = data;

  // Check whether user already exists
  const userExists = await userCollection.findOne({
    email: email,
  });

  if (userExists) {
    req.flash("errors", "User already exists");
    return res.redirect("/register");
  }

  // Hash password using Argon2
  const hashedPassword = await argon2.hash(password);

  // // Hash password
  // const hashedPassword = await bcrypt.hash(password, 10);

  // Store user in MongoDB
  await userCollection.insertOne({
    name,
    email,
    password: hashedPassword,
  });

  return res.redirect("/login");
};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/login", {
    //auth folder-page:login
    errors: req.flash("errors"),
    success: req.flash("success"),
  });
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  // Validate registration data using Zod
  const { data, error } = loginUserSchema.safeParse(req.body);

  if (error) {
    const errors = error.issues[0].message;
    req.flash("errors", errors);
    return res.redirect("/login");
  }

  // Get validated data
  const { email, password } = data;

  // Find user by email
  const user = await userCollection.findOne({
    email: email,
  });
  console.log(user);

  // User doesn't exist
  if (!user) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  // Compare entered password with Argon2 hash
  const isPasswordCorrect = await argon2.verify(user.password, password);

  if (!isPasswordCorrect) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  //res.cookie("isLoggedIn", true); //set cookie onle one

  //const token = generateToken(user._id.toString(), user.name, user.email);

  //res.cookie("access_token", token); // cookie name : access_token

  // 1. Generate unique session ID
  const sessionId = crypto.randomUUID();

  // 2. Generate Access Token
  const accessToken = generateAccessToken(user);

  // 3. Generate Refresh Token
  const refreshToken = generateRefreshToken(user, sessionId);

  const session = await createSession({
    userId: user._id,
    sessionId: sessionId,
    refreshToken: refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  console.log("Session created:", session);

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "lax",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "lax",
  });
};

return res.redirect("/");
export const getme = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const LogoutUser = (req, res) => {
  res.clearCookie("access_token"); //delete access-token when user click logout button
  res.redirect("/login");
};
