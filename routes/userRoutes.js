const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");




const router = express.Router();

router.patch(
  "/updateMe",
  authController.protect,
  userController.uploadProfilePicture,
  userController.updateMe
);

router.get("/getAllUsers", authController.protect, userController.getAllUsers);

router.route("/:id").get(userController.getUser);

module.exports = router;
