const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const express = require("express");
const userRouter = require("./routes/userRoutes");
const authRouter = require("./routes/authRoutes");
const followRouter = require("./routes/followRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");
const likeRouter = require("./routes/likeRoutes");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./util/appError");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const path = require("path");

const passport = require("passport");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'https://9385ece3f902.ngrok-free.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan("dev"));

app.use(passport.initialize());

require("./util/passport")();

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/follows", followRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
