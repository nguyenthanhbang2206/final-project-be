const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AdminRouter = require("./routes/AdminRouter");
const Photo = require("./db/photoModel");
const User = require("./db/userModel");
const authMiddleware = require("./middleware/authMiddleware");

dbConnect();

app.use(cors());
app.use(express.json());

// Serve static images
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/user", UserRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/photo", PhotoRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
