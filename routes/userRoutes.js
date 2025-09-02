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


router.route("/:id").get(userController.getUser);

module.exports = router;
