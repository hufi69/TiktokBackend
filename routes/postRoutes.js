const express = require("express");
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const { uploadPostMedia } = require("../util/multerConfig");
const validateRequest = require("../validations/middleware/validateRequest");
const {
  updatePostSchema,
  getPostsSchema,
} = require("../validations/postSchema");

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Post routes


router.post(
  "/new-post",
  uploadPostMedia,
  postController.createPost
);

router.get("/get-posts", validateRequest(getPostsSchema), postController.getPosts);

router
  .route("/get-post/:id")
  .get(postController.getPost)
  .patch(validateRequest(updatePostSchema), postController.updatePost)
  .delete(postController.deletePost);


module.exports = router;
