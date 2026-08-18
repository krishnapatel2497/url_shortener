import crypto from "crypto"; //random value create.
import {
  getLinkByShortCode,
  loadLinks,
  saveLinks,
} from "../models/shortener.model.js";

export const getShortenerPage = async (req, res) => {
  try {
    const links = await loadLinks();


    let isLoggedIn = req.cookies.isLoggedIn;   //get cookies
    

    return res.render("index", { links, host: req.host, isLoggedIn });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const postURLShortener = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
    const links = await loadLinks();

    if (links[finalShortCode]) {
      return res
        .status(400)
        .send("400 - Short code already exists. Please choose another.");
    }

    await saveLinks({ url, shortCode: finalShortCode });

    return res.redirect("/?success=true");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getLinkByShortCode(shortCode);

    if (!link) return res.status(404).send("404 - Short URL not found");
    return res.redirect(link.url);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};
