import { verifyAccessToken } from "../utils/token.js";

export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    req.user = null;

    return next();
  }

  try {
    const decodedToken = verifyAccessToken(token);

    req.user = decodedToken;
  } catch (error) {
    req.user = null;
  }

  return next();
};
