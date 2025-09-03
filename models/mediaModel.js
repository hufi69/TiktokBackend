const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  duration: {
    // For videos only
    type: Number,
    default: null,
  },
  thumbnail: {
    // For videos - auto-generated thumbnail
    type: String,
    default: null,
  },
});

const Media = mongoose.model("Media", mediaSchema);

module.exports = mediaSchema;
