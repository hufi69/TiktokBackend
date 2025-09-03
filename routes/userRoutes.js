const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const validateRequest = require("../validations/middleware/validateRequest");
const { updateMeSchema } = require("../validations/updateMeSchema");



const router = express.Router();

router.patch(
  "/updateMe",
  authController.protect,
  userController.uploadProfilePicture,
  validateRequest(updateMeSchema),
  userController.updateMe
);

// Follow/Unfollow routes
router.post("/follow/:id", authController.protect, userController.followUser);
router.delete("/unfollow/:id", authController.protect, userController.unfollowUser);
router.get("/followers", authController.protect, userController.getAllFollowers);
router.get("/following", authController.protect, userController.getAllFollowing);
router.get("/mutual-follows", authController.protect, userController.getMutualFollows);
router.get("/followers-count", authController.protect, userController.getFollowersCount);
router.get("/following-count", authController.protect, userController.getFollowingCount);
router.get("/is-following/:id", authController.protect, userController.isFollowing);

// Get all users for follow suggestions
router.get("/all-users", authController.protect, userController.getAllUsers);

router.route("/:id").get(userController.getUser);

module.exports = router;
