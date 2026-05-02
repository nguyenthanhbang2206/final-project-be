const express = require("express");
const User = require("../db/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.post("/login", async (request, response) => {
  const { login_name, password } = request.body;

  if (!login_name || !password) {
    return response.status(400).json({ error: "Login name and password are required" });
  }

  try {
    const user = await User.findOne({ login_name });

    if (!user) {
      return response.status(400).json({ error: "Invalid login name" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.status(400).json({ error: "Incorrect password" });
    }

    const token = jwt.sign(
      { userId: user._id, login_name: user.login_name },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" }
    );

    response.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token
    });
  } catch (error) {
    console.error("Login error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (request, response) => {
  // For JWT, logout is handled by the client by removing the token.
  // We can return a success message.
  response.json({ message: "Logged out successfully" });
});

module.exports = router;
