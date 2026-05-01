const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const Photo = require("./db/photoModel");
const User = require("./db/userModel");

dbConnect();

app.use(cors());
app.use(express.json());
app.use("/api/user", UserRouter);


app.get("/api/photosOfUser/:id", async (request, response) => {
  try {
    const userId = request.params.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.status(400).json({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: userId });

    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const processedComments = await Promise.all(
          photo.comments.map(async (comment) => {
            const commentUser = await User.findById(comment.user_id).select(
              "_id first_name last_name",
            );
            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: commentUser || { _id: comment.user_id },
            };
          }),
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          comments: processedComments,
          file_name: photo.file_name,
          date_time: photo.date_time,
        };
      }),
    );

    response.json(processedPhotos);
  } catch (error) {
    response.status(400).json({ error: "Invalid user ID" });
  }
});

app.use("/api/photo", PhotoRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
