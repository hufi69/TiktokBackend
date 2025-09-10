const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema({
  comment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    index: true, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent duplicate likes
commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });

const CommentLike = mongoose.model('CommentLike', commentLikeSchema);

module.exports = CommentLike;
