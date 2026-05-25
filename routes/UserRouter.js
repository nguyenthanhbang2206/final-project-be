const express = require("express");
const User = require("../db/userModel");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("_id first_name last_name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user list" });
  }
});


router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select(
      "_id first_name last_name location description occupation",
    );

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

router.post("/", async (req, res) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

  if (!login_name || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(400).json({ error: "Login name already exists" });
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

    res.json({
      _id: newUser._id,
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// EDIT USER
router.put("/me", authMiddleware, async (req, res) => {
  const {
    first_name,
    last_name,
    location,
    description,
    occupation,
  } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        first_name,
        last_name,
        location,
        description,
        occupation,
      },
      {
        new: true,
      },
    ).select(
      "_id first_name last_name location description occupation login_name",
    );

    if (!updatedUser) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});
module.exports = router;
