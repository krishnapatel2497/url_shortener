import jwt from "jsonwebtoken";

export const generateToken = (id, name, email) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
