const mongoose = require("mongoose")

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Add compound index to prevent duplicate likes
likeSchema.index({ user: 1, post: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;