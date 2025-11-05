const express = require("express");
const router = express.Router();
const admin = require("../config/firebase-admin");

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await admin.auth().getUser(uid);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;