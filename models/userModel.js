const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    default: null,
  },
  fullName: {
    type: String,
    trim: true,
  },
  // userName: {
  //   type: String,
  //   unique: true,
  //   trim: true,
  //   minlength: [3, "Username must be at least 3 characters long"],
  //   maxlength: [30, "Username must be at most 30 characters long"],
  //   match: [
  //     /^[a-zA-Z0-9_]+$/,
  //     "Username can only contain letters, numbers, and underscores",
  //   ],
  // },
  occupation: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  country: {
    type: String,
  },
  dateOfBirth: {
    type: Date,

    validate: {
      validator: function (value) {
        // Ensure the date is in the past and user is at least 13 years old
        const today = new Date();
        const minAge = 13;
        const minDate = new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate()
        );
        return value < minDate;
      },
      message: "User must be at least 13 years old",
    },
  },
  role: {
    type: String,
    enum: ["user"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [8, "Password must be at least 8 characters long"],
    select: false,
  },

  // passwordConfirm: {
  //   type: String,
  //   required: [true, "Please confirm your password"],
  //   validate: {
  //     validator(val) {
  //       return val === this.password;
  //     },
  //     message: "Passwords do not match",
  //     select: false,
  //   },
  // },

  profilePicture: {
    type: String,
    default: null,
  },

  active: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  otp: String,
  otpExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, async function (next) {
  // Checking if this is a population query
  const isPopulation =
    this.getQuery()._id && typeof this.getQuery()._id === "object";

  // Check if we should allow inactive users (for OTP functions)
  const allowInactiveUsers = this.getOptions().allowInactiveUsers;
  const isAdminRequest = this.getOptions().requestedBy === "admin";

  if (!isAdminRequest && !allowInactiveUsers && !isPopulation) {
    this.find({ active: { $ne: false } });
  }
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const encryptedOtp = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  this.otp = encryptedOtp;
  this.otpExpiry = Date.now() + 10 * 60 * 1000;
  return otp;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
