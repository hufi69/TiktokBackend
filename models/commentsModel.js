const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    index: true, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true, 
    required: true 
  },

  // Null for top-level comments; set for replies
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null, 
    index: true 
  },

  // Root top-level comment id for all descendants (replies of replies)
  root: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null, 
    index: true 
  },

  // Optional materialized path (for future threaded UI / sorting)
  path: { 
    type: String, 
    default: null, 
    index: true 
  },

  depth: { 
    type: Number, 
    default: 0 
  }, // 0 = top-level, 1 = reply, 2 = reply-of-reply (if you allow)

  content: { 
    type: String, 
    required: true, 
    trim: true 
  },
  likesCount: { 
    type: Number, 
    default: 0 
  },
  repliesCount: { 
    type: Number, 
    default: 0 
  }, // denormalized counter for direct children

  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  deletedAt: { 
    type: Date, 
    default: null, 
    index: true 
  } // soft delete
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Compound indexes to support list queries
commentSchema.index({ post: 1, parent: 1, createdAt: -1, _id: -1 });   // top-level list
commentSchema.index({ parent: 1, createdAt: -1, _id: -1 });            // replies list
commentSchema.index({ post: 1, root: 1, createdAt: -1 });              // thread subsets

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
