const Comment = require("../models/commentsModel");
const catchAsync = require("../util/catchAsync");

exports.createComment = catchAsync(async (req, res, next) => { 
  const { postId, content } = req.body;
  const comment = await Comment.create({  
    post: postId,
    user: req.user._id,
    content,
    
  });
});