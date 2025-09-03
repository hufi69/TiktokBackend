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

  const data = JSON.parse(req.body.data);

  if (data.password || data.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterObj(
    data,
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

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-password -googleId -twoFactorEnabled -isEmailVerified -rememberMe -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

