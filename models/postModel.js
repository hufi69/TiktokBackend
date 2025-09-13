const mongoose = require("mongoose")



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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    trim: true
  },
  media: [mediaSchema],
  likes: {
    type : Number,
    default : 0
  },
  comments: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], 
      default: [0, 0]
    },
    address: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ tags: 1 });

// Pre-save middleware
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;