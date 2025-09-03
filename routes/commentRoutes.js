const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

const router = express.Router();    

router.use(authController.protect);

router.get("/get-comments/:postId", commentController.getComments);
router.get("/get-comment/:commentId", commentController.getComment);
router.post("/create-comment", commentController.createComment);
router.delete("/delete-comment", commentController.deleteComment);
router.patch("/update-comment", commentController.updateComment);

module.exports = router;
