import express from "express";

import {
  sendTestEmail,
} from "../services/email.service.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {

  try {

    await sendTestEmail();

    return res.send(
      "Test email sent successfully. Check your terminal for the preview URL."
    );

  } catch (error) {

    console.error(
      "Email Error:",
      error
    );

    return res.status(500).send(
      "Failed to send email."
    );
  }
});

export default router;