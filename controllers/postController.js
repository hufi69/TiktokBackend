const Post = require('../models/postModel');
const User = require('../models/userModel');
const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const fs = require('fs');
const path = require('path');

// Helper function to process uploaded files
const processUploadedFiles = (req) => {
  const media = [];
  
  if (req.files) {
    // Process images
    if (req.files.images) {
      req.files.images.forEach(file => {
        media.push({
          type: 'image',
          url: `/public/uploads/posts/images/${file.filename}`,
          filename: file.filename,
          size: file.size
        });
      });
    }
    
    // Process videos
    if (req.files.videos) {
      req.files.videos.forEach(file => {
        media.push({
          type: 'video',
          url: `/public/uploads/posts/videos/${file.filename}`,
          filename: file.filename,
          size: file.size
          // Note: Duration and thumbnail would be added by video processing service
        });
      });
    }
  }
  
  return media;
};

// Create a new post
exports.createPost = catchAsync(async (req, res, next) => {
  const { content, isPublic, tags, location } = req.body;
  
  // Process uploaded media files
  const media = processUploadedFiles(req);
  
  // Validate that post has either content or media
  if (!content && media.length === 0) {
    return next(new AppError('Post must contain either text content or media', 400));
  }
  
  // Prepare post data
  const postData = {
    author: req.user.id,
    content: content || '',
    media,
    isPublic: isPublic !== undefined ? isPublic : true,
    tags: tags || []
  };
  
  // Add location if provided
  if (location && location.latitude && location.longitude) {
    postData.location = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
      address: location.address
    };
  }
  
  const post = await Post.create(postData);
  
  // Populate author information
  await post.populate('author', 'fullName userName profilePicture');
  
  res.status(201).json({
    status: 'success',
    data: {
      post
    }
  });
});

// Get all posts (with pagination and filtering)
exports.getPosts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, author, tags, sort = 'newest' } = req.query;
  
  // Build query
  const query = { isPublic: true };
  
  if (author) {
    query.author = author;
  }
  
  if (tags) {
    query.tags = { $in: tags.split(',') };
  }
  
  // Build sort
  let sortBy = { createdAt: -1 };
  if (sort === 'oldest') {
    sortBy = { createdAt: 1 };
  } else if (sort === 'popular') {
    sortBy = { likes: -1, createdAt: -1 };
  }
  
  // Execute query with pagination
  const posts = await Post.find(query)
    .populate('author', 'fullName userName profilePicture')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit * 1);
  
  const total = await Post.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: posts.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: {
      posts
    }
  });
});

// Get a single post
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'fullName userName profilePicture')
    .populate('comments');
  
  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      post
    }
  });
});

// Update a post
exports.updatePost = catchAsync(async (req, res, next) => {
  const { content, isPublic, tags } = req.body;
  
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }
  
  // Check if user is the author
  if (post.author.toString() !== req.user.id) {
    return next(new AppError('You can only update your own posts', 403));
  }
  
  // Update post
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    { content, isPublic, tags },
    { new: true, runValidators: true }
  ).populate('author', 'fullName userName profilePicture');
  
  res.status(200).json({
    status: 'success',
    data: {
      post: updatedPost
    }
  });
});

// Delete a post
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }
  
  // Check if user is the author
  if (post.author.toString() !== req.user.id) {
    return next(new AppError('You can only delete your own posts', 403));
  }
  
  // Delete associated media files
  post.media.forEach(mediaItem => {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'posts', 
      mediaItem.type === 'image' ? 'images' : 'videos', mediaItem.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  
  await Post.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Like/Unlike a post
exports.toggleLike = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }
  
  const userId = req.user.id;
  const isLiked = post.likes.includes(userId);
  
  if (isLiked) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }
  
  await post.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      post,
      liked: !isLiked
    }
  });
});