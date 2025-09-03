const express = require("express");

const authController = require("../controllers/authController");
const followController = require("../controllers/followController");





const router = express.Router();
router.use(authController.protect);

router.post(
  "/new-follow",
  followController.followUser
);
router.delete("/unfollow", followController.unfollowUser);

router.get("/following", followController.getFollowing);
router.get("/mutual", followController.getMutualFollows);
router.get("/followers-count", followController.getFollowersCount);
router.get("/following-count", followController.getFollowingCount);
router.get("/followers", followController.getFollowers);
router.get("/is-following", followController.isFollowing);




module.exports = router;
