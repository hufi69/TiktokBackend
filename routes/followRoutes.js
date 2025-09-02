const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");





const router = express.Router();

router.post(
  "/",
  authController.protect,
  userController.followUser
);

// router.route("/:id").get(userController.getUser);

module.exports = router;
