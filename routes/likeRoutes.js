const express = require("express");
const likeController = require("../controllers/likeController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/toggle", likeController.toggleLike);
router.post("/like", likeController.likePost);
router.delete("/unlike", likeController.unlikePost);
router.get("/get-likes", likeController.getLikes);


module.exports = router;