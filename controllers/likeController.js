const Like = require("../models/likeModel");
const Post = require("../models/postModel");
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
  const { postId } = req.body;
  const userId = req.user._id;
  
  const like = await Like.findOneAndDelete({ post: postId, user: userId });

  if (!like) {
    return next(new AppError("Like not found or already unliked", 404));
  }
  
  const post = await Post.findById(postId);
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

exports.toggleLike = catchAsync(async (req, res, next) => {
  const { postId } = req.body;
  const userId = req.user._id;

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  // Check if user already liked the post
  const existingLike = await Like.findOne({ post: postId, user: userId });
  
  if (existingLike) {
    // Unlike the post
    await Like.findByIdAndDelete(existingLike._id);
    post.likes--;
    await post.save();
    
    res.status(200).json({
      status: "success",
      message: "Post unliked successfully",
      isLiked: false,
      likesCount: post.likes,
    });
  } else {
    // Like the post
    const like = await Like.create({
      post: postId,
      user: userId,
    });
    
    post.likes++;
    await post.save();
    
    res.status(200).json({
      status: "success",
      message: "Post liked successfully",
      isLiked: true,
      likesCount: post.likes,
      data: {
        like,
      },
    });
  }
});

exports.getLikes = catchAsync(async (req, res, next) => {
  const { postId } = req.query;
  const likes = await Like.find({ post: postId }).populate("user", "fullName userName profilePicture");
  res.status(200).json({
    status: "success",
    results: likes.length,
    data: {
      likes,
    },
  });
});