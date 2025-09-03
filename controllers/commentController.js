const Comment = require("../models/commentsModel");
const Post = require("../models/postModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.getComments = catchAsync(async (req, res, next) => { 
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId }).populate("user", "fullName userName profilePicture");
  res.status(200).json({
    status: "success",
    data: {
      comments,
    },
  });
});

exports.getComment = catchAsync(async (req, res, next) => { 
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId).populate("user", "fullName userName profilePicture");
  res.status(200).json({
    status: "success",
    data: {
      comment,
    },
  });
});

exports.createComment = catchAsync(async (req, res, next) => { 
  const { postId, content } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }
  const comment = await Comment.create({  
    post: postId,
    user: req.user._id,
    content,
  });

  // Add comment ID to post's comments array
  post.comments.push(comment._id);
  await post.save();

  res.status(201).json({
    status: "success",
    data: {
      comment,
    },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId , postId  } = req.body;
  const userId = req.user._id;
  const comment = await Comment.findOneAndDelete( { _id: commentId , user: userId });

  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }
  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }
  // Remove comment ID from post's comments array
  post.comments = post.comments.filter(id => id.toString() !== commentId);
  await post.save();
  res.status(200).json({
    status: "success",
    message: "Comment deleted successfully",
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {   
  const { commentId , content } = req.body;
  const userId = req.user._id;
  const comment = await Comment.findOneAndUpdate( { _id: commentId , user: userId }, { content }, { new: true });
  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      comment,
    },
  });
});
