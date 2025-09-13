const Follow = require("../models/followModel");
const User = require("../models/userModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.followUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  await Follow.create({
    follower: req.user._id,
    following: userId,
  });

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  user.followers++;
  await user.save();

  const follower = await User.findById(req.user._id);
  if (!follower) {
    return next(new AppError("User not found", 404));
  }
  follower.following++;
  await follower.save();

  res.status(200).json({
    status: "success",
    message: "User followed successfully",
  });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  await Follow.findOneAndDelete({ follower: req.user._id, following: userId });

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  user.followers--;
  await user.save();

  const follower = await User.findById(req.user._id);
  if (!follower) {
    return next(new AppError("User not found", 404));
  }
  follower.following--;
  await follower.save();

  res.status(200).json({
    status: "success",
    message: "User unfollowed successfully",
  });
});

exports.getFollowers = catchAsync(async (req, res, next) => {
  const followers = await Follow.getFollowers(req.user._id);

  res.status(200).json({
    status: "success",
    followers,
  });
});

exports.getFollowing = catchAsync(async (req, res, next) => {
  const following = await Follow.getFollowing(req.user._id);

  res.status(200).json({
    status: "success",
    following,
  });
});

exports.getMutualFollows = catchAsync(async (req, res, next) => { 
  const { userId } = req.params;
  const mutualFollows = await Follow.getMutualFollows(req.user._id, userId);

  res.status(200).json({
    status: "success",
    mutualFollows,
  });
});

exports.getFollowersCount = catchAsync(async (req, res, next) => {    
  const followersCount = await Follow.getFollowersCount(req.user._id);

  res.status(200).json({
    status: "success",
    followersCount,
  });
});

exports.getFollowingCount = catchAsync(async (req, res, next) => {    
  const followingCount = await Follow.getFollowingCount(req.user._id);      

  res.status(200).json({
    status: "success",
    followingCount,
  });
});

exports.isFollowing = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const isFollowing = await Follow.isFollowing(req.user._id, userId);

  res.status(200).json({
    status: "success",
    isFollowing,
  });
});