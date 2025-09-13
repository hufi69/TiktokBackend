const Post = require("../models/postModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const fs = require("fs");
const path = require("path");
const Like = require("../models/likeModel");

// Helper function to process uploaded media files
const processUploadedFiles = (req) => {
  const media = [];

  if (req.files) {
    // Processing images
    if (req.files.images) {
      req.files.images.forEach((file) => {
        media.push({
          type: "image",
          url: `/public/uploads/posts/images/${file.filename}`,
          filename: file.filename,
          size: file.size,

        });
      });
    }

    // Processing  videos
    if (req.files.videos) {
      req.files.videos.forEach((file) => {
        media.push({
          type: "video",
          url: `/public/uploads/posts/videos/${file.filename}`,
          filename: file.filename,
          size: file.size,
          // Note: Duration and thumbnail would be added by video processing service in the future
        });
      });
    }
  }

  return media;
};

exports.createPost = catchAsync(async (req, res, next) => {
  console.log("New post**********", req.files);
 // Parse the data from the request body
  const data = JSON.parse(req.body.data);

  const { content, isPublic, tags, location } = data;

  // Processing uploaded media files
  const media = processUploadedFiles(req);

  // Validating that post has either content or media
  if (!content && media.length === 0) {
    return next(
      new AppError("Post must contain either text content or media", 400)
    );
  }

  // Preparing post data
  const postData = {
    author: req.user.id,
    content: content || "",
    media,
    isPublic: isPublic !== undefined ? isPublic : true,
    tags: tags || [],
  };

  // Adding location if provided
  if (location && location.latitude && location.longitude) {
    postData.location = {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
      address: location.address,
    };
  }

  const post = await Post.create(postData);

  // Populating author information
  await post.populate("author", "fullName userName profilePicture");

  res.status(201).json({
    status: "success",
    data: {
      post,
    },
  });
});

exports.getPosts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, author, tags, sort = "newest" } = req.query;

  // Building the query for getting posts
  const query = { isPublic: true };

  if (author) {
    query.author = author;
  }

  if (tags) {
    query.tags = { $in: tags.split(",") };
  }

  // Building the sort for getting posts
  let sortBy = { createdAt: -1 };
  if (sort === "oldest") {
    sortBy = { createdAt: 1 };
  } else if (sort === "popular") {
    sortBy = { likes: -1, createdAt: -1 };
  }

  // Executing the query with pagination
  const posts = await Post.find(query)
    .populate("author", "fullName userName profilePicture")
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit * 1);

  const total = await Post.countDocuments(query);

  
  const userId = req.user._id 
  let likedSet = new Set();

  if (userId) {
    // One DB call to get likes by this user for all posts on the page
    const postIds = posts.map((p) => p._id);
    const likes = await Like.find({ user: userId, post: { $in: postIds } }).select("post");


    likedSet = new Set(likes.map((l) => l.post.toString()));
  }

  // Convert posts to plain objects and attach likedByMe
  const postsWithLikeFlag = posts.map((p) => {
    const obj = p.toObject({ virtuals: true }); // keep virtuals if any
    obj.likedByMe = userId ? likedSet.has(p._id.toString()) : false;
    return obj;
  });

  // Send response
  res.status(200).json({
    status: "success",
    results: postsWithLikeFlag.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit), 
    data: { posts: postsWithLikeFlag },
  });

});

// Getting a single post
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "fullName userName profilePicture"
  );

  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  const likedByMe = !!(await Like.exists({ user: req.user._id }));
  res.status(200).json({
    status: "success",
    data: {
      post,
      likedByMe,
    },
  });
});

// Updating a post
exports.updatePost = catchAsync(async (req, res, next) => {
  const { content, isPublic, tags } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  // Checking if user is the author
  if (post.author.toString() !== req.user.id) {
    return next(new AppError("You can only update your own posts", 403));
  }

  // Updating the post
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    { content, isPublic, tags },
    { new: true, runValidators: true }
  ).populate("author", "fullName userName profilePicture");

  res.status(200).json({
    status: "success",
    data: {
      post: updatedPost,
    },
  });
});

// Deleting a post
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  // Checking if user is the author
  if (post.author.toString() !== req.user.id) {
    return next(new AppError("You can only delete your own posts", 403));
  }

  // Deleting associated media files
  post.media.forEach((mediaItem) => {
    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "posts",
      mediaItem.type === "image" ? "images" : "videos",
      mediaItem.filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  await Post.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
