const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

const router = express.Router();    

router.use(authController.protect);

// New scalable endpoints
// replies of a comment
router.get('/:commentId/replies', commentController.listReplies);

// single comment ops
router.patch('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

// likes
router.post('/:commentId/likes', commentController.likeComment);
router.delete('/:commentId/likes', commentController.unlikeComment);

// Legacy endpoints for backward compatibility
router.get("/get-comments/:postId", commentController.getComments);
router.get("/get-comment/:commentId", commentController.getComment);
router.post("/create-comment", commentController.createComment);
router.delete("/delete-comment", commentController.deleteComment);
router.patch("/update-comment", commentController.updateComment);

module.exports = router;
