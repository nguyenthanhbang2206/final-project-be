const express = require("express");
const Photo = require("../db/photoModel");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.get("/list", authMiddleware, async (request, response) => {
  try {
    const photos = await Photo.find({});
    response.json(photos);
  } catch (error) {
    response.status(500).json({ error: "Failed to fetch photo list" });
  }
});

router.post("/commentsOfPhoto/:photo_id", authMiddleware, async (request, response) => {
  const photoId = request.params.photo_id;
  const { comment } = request.body;

  if (!comment) {
    return response.status(400).json({ error: "Comment text is required" });
  }

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return response.status(400).json({ error: "Photo not found" });
    }

    const newComment = {
      comment: comment,
      user_id: request.user.userId,
      date_time: new Date(),
    };

    photo.comments.push(newComment);
    await photo.save();

    response.json(newComment);
  } catch (error) {
    console.error("Add comment error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

router.post("/new", authMiddleware, upload.single("photo"), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ error: "No photo file uploaded" });
  }

  try {
    const newPhoto = new Photo({
      file_name: request.file.filename,
      user_id: request.user.userId,
      date_time: new Date(),
      comments: [],
    });

    await newPhoto.save();
    response.json(newPhoto);
  } catch (error) {
    console.error("Photo upload error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
