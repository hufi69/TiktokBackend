const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Follower is required"],
    index: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Following user is required"],
    index: true,
  },
  status: {
    type: String,
    enum: ["active", "blocked", "pending"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for efficient queries
followSchema.index({ follower: 1, status: 1 });
followSchema.index({ following: 1, status: 1 });

// Update timestamp on save
followSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual populate for follower details
followSchema.virtual("followerDetails", {
  ref: "User",
  localField: "follower",
  foreignField: "_id",
  justOne: true,
});

// Virtual populate for following user details
followSchema.virtual("followingDetails", {
  ref: "User",
  localField: "following",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
followSchema.set("toJSON", { virtuals: true });
followSchema.set("toObject", { virtuals: true });

// Static method to check if user A follows user B
followSchema.statics.isFollowing = async function (followerId, followingId) {
  return !!(await this.exists({
    follower: followerId,
    following: followingId,
    status: "active",
  }));

};

// Static method to get followers count
followSchema.statics.getFollowersCount = function (userId) {
  return this.countDocuments({
    following: userId,
    status: "active",
  });
};

// Static method to get following count
followSchema.statics.getFollowingCount = function (userId) {
  return this.countDocuments({
    follower: userId,
    status: "active",
  });
};

// Static method to get followers list with pagination
followSchema.statics.getFollowers = function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    following: userId,
    status: "active",
  })
    .populate("follower", "fullName userName profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get following list with pagination
followSchema.statics.getFollowing = function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    follower: userId,
    status: "active",
  })
    .populate("following", "fullName userName profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get mutual follows
followSchema.statics.getMutualFollows = function (userId1, userId2) {
  return this.find({
    $or: [
      { follower: userId1, following: userId2 },
      { follower: userId2, following: userId1 },
    ],
    status: "active",
  });
};

const Follow = mongoose.model("Follow", followSchema);

module.exports = Follow;
