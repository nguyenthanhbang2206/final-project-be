const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

router.get("/list", async (request, response) => {
  try {
    const users = await User.find({}).select("_id first_name last_name");
    console.log(users);
    
    response.json(users);
  } catch (error) {
    response.status(500).json({ error: "Failed to fetch user list" });
  }
});


router.get("/:id", async (request, response) => {
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
});

module.exports = router;
