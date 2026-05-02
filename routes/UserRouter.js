const express = require("express");
const User = require("../db/userModel");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", authMiddleware, async (request, response) => {
  try {
    const users = await User.find({}).select("_id first_name last_name");
    response.json(users);
  } catch (error) {
    response.status(500).json({ error: "Failed to fetch user list" });
  }
});


router.get("/:id", authMiddleware, async (request, response) => {
  try {
    const userId = request.params.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select(
      "_id first_name last_name location description occupation",
    );

    if (!user) {
      return response.status(400).json({ error: "User not found" });
    }

    response.json(user);
  } catch (error) {
    response.status(400).json({ error: "Invalid user ID" });
  }
});

router.post("/", async (request, response) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = request.body;

  if (!login_name || !password || !first_name || !last_name) {
    return response.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return response.status(400).json({ error: "Login name already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      login_name,
      password: hashedPassword,
      first_name,
      last_name,
      location,
      description,
      occupation
    });

    await newUser.save();

    response.json({
      _id: newUser._id,
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    });
  } catch (error) {
    console.error("Registration error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
