const Comment = require("../models/commentsModel");
const Post = require("../models/postModel");
const CommentLike = require("../models/commentLikeModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const { buildCursorQuery, getNextCursor } = require("../utils/pagination");

// List top-level comments
exports.listComments = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor;

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) return next(new AppError('Post not found', 404));

  const cursorQuery = buildCursorQuery(cursor);

  const items = await Comment.find({
      post: postId,
      parent: null,
      deletedAt: null,
      ...cursorQuery
    })
    .populate('user', 'fullName userName profilePicture')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1); // over-fetch to compute nextCursor

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getNextCursor(sliced[sliced.length - 1]) : null;

  res.status(200).json({
    status: 'success',
    data: { items: sliced, nextCursor }
  });
});

// List replies of a comment
exports.listReplies = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor;

  const parent = await Comment.findById(commentId);
  if (!parent || parent.deletedAt) return next(new AppError('Comment not found', 404));

  const cursorQuery = buildCursorQuery(cursor);

  const items = await Comment.find({
      parent: commentId,
      deletedAt: null,
      ...cursorQuery
    })
    .populate('user', 'fullName userName profilePicture')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getNextCursor(sliced[sliced.length - 1]) : null;

  res.status(200).json({
    status: 'success',
    data: { items: sliced, nextCursor }
  });
});

// Create comment / reply (with counters)
exports.createComment = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  if (!content || !content.trim()) return next(new AppError('Content required', 400));
  if (content.length > 1000) return next(new AppError('Comment too long', 400));

  const post = await Post.findById(postId);
  if (!post) return next(new AppError('Post not found', 404));

  let parent = null, root = null, depth = 0, path = null;

  if (parentId) {
    parent = await Comment.findById(parentId);
    if (!parent || parent.deletedAt) return next(new AppError('Parent comment not found', 404));
    root = parent.root || parent._id;
    depth = parent.depth + 1;

    // If you want to limit nesting depth (e.g., 2 levels), enforce it:
    if (depth > 1) return next(new AppError('Max reply depth reached', 400));

    // optional: path for threaded ordering
    path = `${(parent.path || parent._id.toString())}`;
  }

  const comment = await Comment.create({
    post: post._id,
    user: req.user._id,
    parent: parent ? parent._id : null,
    root,
    depth,
    path,
    content: content.trim()
  });
  await comment.populate('user', 'fullName userName profilePicture');

  // Denormalized counters (atomic)
  await Post.updateOne({ _id: post._id }, {
    $inc: { commentsCount: 1 },
    $set: { lastCommentedAt: new Date() }
  });

  if (parent) {
    await Comment.updateOne({ _id: parent._id }, { $inc: { repliesCount: 1 } });
  }

  res.status(201).json({ status: 'success', data: { comment } });
});

// Update comment
exports.updateComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findOne({ _id: commentId, user: req.user._id, deletedAt: null });
  if (!comment) return next(new AppError('Comment not found', 404));
  if (!content || !content.trim()) return next(new AppError('Content required', 400));

  comment.content = content.trim();
  await comment.save();

  res.status(200).json({ status: 'success', data: { comment } });
});

// Delete comment (soft delete if it has replies)
exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findOne({ _id: commentId, user: req.user._id });
  if (!comment) return next(new AppError('Comment not found', 404));

  // check if has children
  const childExists = await Comment.exists({ parent: comment._id, deletedAt: null });

  if (childExists) {
    // Soft delete only the content; keep counts & thread structure
    comment.content = '[deleted]';
    comment.deletedAt = new Date();
    await comment.save();
  } else {
    // Hard delete and decrement counters
    await comment.deleteOne();
    await Post.updateOne({ _id: comment.post }, { $inc: { commentsCount: -1 } });
    if (comment.parent) {
      await Comment.updateOne({ _id: comment.parent }, { $inc: { repliesCount: -1 } });
    }
  }

  res.status(200).json({ status: 'success', message: 'Comment removed' });
});

// Like comment
exports.likeComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment || comment.deletedAt) return next(new AppError('Comment not found', 404));

  const created = await CommentLike.findOneAndUpdate(
    { comment: commentId, user: req.user._id },
    { $setOnInsert: { comment: commentId, user: req.user._id } },
    { new: true, upsert: true }
  );

  if (created) {
    await Comment.updateOne({ _id: commentId }, { $inc: { likesCount: 1 } });
  }

  res.status(200).json({ status: 'success', data: { liked: true } });
});

// Unlike comment
exports.unlikeComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const removed = await CommentLike.findOneAndDelete({ comment: commentId, user: req.user._id });
  if (removed) {
    await Comment.updateOne({ _id: commentId }, { $inc: { likesCount: -1 } });
  }
  res.status(200).json({ status: 'success', data: { liked: false } });
});

// Legacy endpoints for backward compatibility
exports.getComments = exports.listComments;
exports.getComment = catchAsync(async (req, res, next) => { 
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId).populate("user", "fullName userName profilePicture");
  res.status(200).json({
    status: "success",
    data: {
      comment,
    },
  });
});
