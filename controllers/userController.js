const User = require("../models/userModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadProfilePicture = upload.single("profilePicture");
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log("req.file", req.file);
  console.log("req.body", req.body);

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    "fullName",
    "userName",
    "occupation",
    "email",
    "country",
    "dateOfBirth"
  );

  if (req.file) filteredBody.profilePicture = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  console.log("updatedUser", updatedUser);
  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Follow/Unfollow functionality
exports.followUser = catchAsync(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);
  if (!userToFollow) {
    return next(new AppError("User not found", 404));
  }

  if (req.user.id === req.params.id) {
    return next(new AppError("You cannot follow yourself", 400));
  }

  const currentUser = await User.findById(req.user.id);
  
  if (currentUser.following.includes(req.params.id)) {
    return next(new AppError("You are already following this user", 400));
  }

  // Add to following
  currentUser.following.push(req.params.id);
  await currentUser.save();

  // Add to followers
  userToFollow.followers.push(req.user.id);
  await userToFollow.save();

  res.status(200).json({
    status: "success",
    message: "User followed successfully",
  });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  const userToUnfollow = await User.findById(req.params.id);
  if (!userToUnfollow) {
    return next(new AppError("User not found", 404));
  }

  if (req.user.id === req.params.id) {
    return next(new AppError("You cannot unfollow yourself", 400));
  }

  const currentUser = await User.findById(req.user.id);
  
  if (!currentUser.following.includes(req.params.id)) {
    return next(new AppError("You are not following this user", 400));
  }

  // Remove from following
  currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
  await currentUser.save();

  // Remove from followers
  userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user.id);
  await userToUnfollow.save();

  res.status(200).json({
    status: "success",
    message: "User unfollowed successfully",
  });
});

exports.getAllFollowers = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('followers', 'fullName userName email profilePicture');
  
  res.status(200).json({
    status: "success",
    data: user.followers,
  });
});

exports.getAllFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('following', 'fullName userName email profilePicture');
  
  res.status(200).json({
    status: "success",
    data: user.following,
  });
});

exports.getMutualFollows = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const mutualFollows = user.following.filter(followingId => 
    user.followers.includes(followingId)
  );
  
  const mutualUsers = await User.find({ _id: { $in: mutualFollows } }, 'fullName userName email profilePicture');
  
  res.status(200).json({
    status: "success",
    data: mutualUsers,
  });
});

exports.getFollowersCount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: "success",
    count: user.followers.length,
  });
});

exports.getFollowingCount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: "success",
    count: user.following.length,
  });
});

exports.isFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const isFollowing = user.following.includes(req.params.id);
  
  res.status(200).json({
    status: "success",
    isFollowing,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user.id);
  const users = await User.find({ _id: { $ne: req.user.id } }, 'fullName userName email profilePicture occupation');
  
  // Add isFollowing property to each user
  const usersWithFollowStatus = users.map(user => {
    const userObj = user.toObject();
    userObj.isFollowing = currentUser.following.includes(user._id);
    return userObj;
  });
  
  res.status(200).json({
    status: "success",
    data: usersWithFollowStatus,
  });
});


