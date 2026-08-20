import { verifyJWTToken } from "../utils/generateToken.js";

export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;

  // console.log("Token:", token);

  if (!token) {
    req.user = null;
    //console.log("req.user:", req.user);
    return next();
  }
  try {
    const decodedToken = verifyJWTToken(token);
    req.user = decodedToken;

    console.log("req.user:", req.user);
  } catch (error) {
    console.log("JWT Error:", error.message);
    req.user = null;
  }
  return next();
};
