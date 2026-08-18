import { userCollection } from "../config/db-client.js";
//import bcrypt from "bcrypt";
import argon2 from "argon2";

export const getRegisterPage = (req, res) => {
  return res.render("auth/register"); //auth folder-page:register
};

export const postRegisterPage = async (req, res) => {
  console.log(req.body);

  // Get registration data
  const { name, email, password } = req.body;

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
  return res.render("auth/login"); //auth folder-page:login
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  // Find user by email
  const user = await userCollection.findOne({
    email: email,
  });
  console.log(user);

  // User doesn't exist
  if (!user) {
    return res.send("Invalid email or password");
  }

  // // Compare entered password with hashed password
  // const isPasswordCorrect = await bcrypt.compare(password, user.password);

  // Compare entered password with Argon2 hash
  const isPasswordCorrect = await argon2.verify(user.password, password);

  if (!isPasswordCorrect) {
    return res.send("Invalid email or password");
  }

  res.cookie("isLoggedIn", true); //set cookie

  res.redirect("/");
};
