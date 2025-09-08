const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const { uploadPostMedia } = require('../util/multerConfig');
const validateRequest = require('../validations/middleware/validateRequest');
const { createPostSchema, updatePostSchema, getPostsSchema } = require('../validations/postSchema');

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Post routes
router.route('/')
  .post(
    uploadPostMedia,
    validateRequest(createPostSchema),
    postController.createPost
  )
  .get(
    validateRequest(getPostsSchema),
    postController.getPosts
  );

router.route('/:id')
  .get(postController.getPost)
  .patch(
    uploadPostMedia,
    validateRequest(updatePostSchema),
    postController.updatePost
  )
  .delete(postController.deletePost);

// Like/Unlike post
router.patch('/:id/like', postController.toggleLike);

module.exports = router;


