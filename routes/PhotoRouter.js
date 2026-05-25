const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
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

const upload = multer({ storage });

// GET ALL PHOTOS
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({});
    res.json(photos);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch photo list",
    });
  }
});

// ADD COMMENT
router.post("/commentsOfPhoto/:photoId", authMiddleware, async (req, res) => {
  const { photoId } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({
      error: "Comment text is required",
    });
  }

  try {
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(400).json({
        error: "Photo not found",
      });
    }

    photo.comments.push({
      comment,
      user_id: req.user.userId,
      date_time: new Date(),
    });
    await photo.save();
    await photo.populate("comments.user_id", "_id first_name last_name");
    const newComment = photo.comments[photo.comments.length - 1];
    res.json(newComment);
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// EDIT COMMENT
router.put(
  "/comments/:photoId/:commentId",
  authMiddleware,
  async (req, res) => {
    const { photoId, commentId } = req.params;
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({
        error: "Comment text is required",
      });
    }
    try {
      const photo = await Photo.findById(photoId);
      if (!photo) {
        return res.status(400).json({
          error: "Photo not found",
        });
      }
      const existingComment = photo.comments.id(commentId);
      if (!existingComment) {
        return res.status(400).json({
          error: "Comment not found",
        });
      }

      if (String(existingComment.user_id) !== req.user.userId) {
        return res.status(403).json({
          error: "Not allowed to edit this comment",
        });
      }
      existingComment.comment = comment;
      existingComment.date_time = new Date();
      await photo.save();
      await photo.populate("comments.user_id", "_id first_name last_name");
      const updatedComment = photo.comments.id(commentId);
      res.json(updatedComment);
    } catch (error) {
      console.error("Update comment error:", error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

// DELETE COMMENT
router.delete(
  "/comments/:photoId/:commentId",
  authMiddleware,
  async (req, res) => {
    const { photoId, commentId } = req.params;
    try {
      const photo = await Photo.findById(photoId);
      if (!photo) {
        return res.status(400).json({
          error: "Photo not found",
        });
      }

      const existingComment = photo.comments.id(commentId);

      if (!existingComment) {
        return res.status(400).json({
          error: "Comment not found",
        });
      }

      if (String(existingComment.user_id) !== req.user.userId) {
        return res.status(403).json({
          error: "Not allowed to delete this comment",
        });
      }
      photo.comments.pull(commentId);
      await photo.save();
      res.json({
        message: "Comment deleted",
      });
    } catch (error) {
      console.error("Delete comment error:", error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

// UPLOAD PHOTO
router.post(
  "/new",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No photo file uploaded",
      });
    }

    try {
      const newPhoto = new Photo({
        file_name: req.file.filename,
        user_id: req.user.userId,
        date_time: new Date(),
        comments: [],
      });

      await newPhoto.save();

      res.json(newPhoto);
    } catch (error) {
      console.error("Photo upload error:", error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

// GET PHOTOS OF USER
router.get("/photosOfUser/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid user ID format",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    const photos = await Photo.find({
      user_id: userId,
    })
      .populate("user_id", "_id first_name last_name")
      .populate("comments.user_id", "_id first_name last_name")
      .lean();

    res.json(photos);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Invalid user ID",
    });
  }
});

module.exports = router;
