import { userCollection } from "../config/db-client.js";
//import bcrypt from "bcrypt";
import argon2 from "argon2";
import { generateToken } from "../utils/generateToken.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/register", { errors: req.flash("errors") }); //auth folder-page:register
};

export const postRegisterPage = async (req, res) => {
  if (req.user) return res.redirect("/");
  //console.log(req.body);

  // Get registration data
  const { name, email, password } = req.body;

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

  res.redirect("/login");
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

  const { email, password } = req.body;
  console.log(req.body);

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

  // // Compare entered password with hashed password
  // const isPasswordCorrect = await bcrypt.compare(password, user.password);

  // Compare entered password with Argon2 hash
  const isPasswordCorrect = await argon2.verify(user.password, password);

  if (!isPasswordCorrect) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  //res.cookie("isLoggedIn", true); //set cookie onle one

  const token = generateToken(user._id.toString(), user.name, user.email);

  res.cookie("access_token", token); // cookie name : access_token
  res.redirect("/");
};

export const getme = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const LogoutUser = (req, res) => {
  res.clearCookie("access_token"); //delete access-token when user click logout button
  res.redirect("/login");
};
