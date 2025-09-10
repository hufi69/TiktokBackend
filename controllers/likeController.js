const Like = require("../models/likeModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentsModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.likePost = catchAsync(async (req, res, next) => {
  const { postId } = req.body;
  const userId = req.user._id;

  const existingLike = await Like.findOne({ post: postId, user: userId });
  if (existingLike) {
    return next(new AppError("Post already liked", 400));
  }

  const like = await Like.create({
    post: postId,
    user: userId,
  });

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }
  post.likes++;
  await post.save();

  res.status(200).json({
    status: "success",
    data: {
      like,
    },
  });
});

exports.unlikePost = catchAsync(async (req, res, next) => {
  const { likeId } = req.body;
  const userId = req.user._id;
  const like = await Like.findOneAndDelete({ _id: likeId, user: userId });

  if (!like) {
    return next(new AppError("Like not found", 404));
  }
  const post = await Post.findById(like.post);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }
  post.likes--;
  await post.save();
  res.status(200).json({
    status: "success",
    message: "Post unliked successfully",
  });
});

exports.getLikes = catchAsync(async (req, res, next) => {
  const { postId } = req.body;
  const likes = await Like.find({ post: postId }).populate(
    "user",
    "fullName userName profilePicture"
  );
  res.status(200).json({
    status: "success",
    results: likes.length,
    data: {
      likes,
    },
  });
});

exports.likeComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.body;
  const userId = req.user._id;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }
  const existingLike = await Like.findOne({ comment: commentId, user: userId  });
  if (existingLike) {
    await existingLike.deleteOne();
    if (comment.likes > 0) {
      comment.likes--;
    }
    await comment.save();
    return res.status(200).json({
      status: "success",
      message: "Comment unliked successfully",
    });
  }
  const like = await Like.create({
    comment: comment._id,
    user: userId,
  });


  comment.likes++;
 
  await comment.save();

  res.status(200).json({
    status: "success",
    data: {
      like,
    },
  });
});
