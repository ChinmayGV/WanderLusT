const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const optionController = require("../controllers/options.js");
const { isLoggedIn } = require("../middleware");
const { userSchema } = require("../schema.js");
const multer = require("multer"); //to parse form data
const { storage } = require("../cloudConfig.js");
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
});

router.get("/myProfile", optionController.renderMyProfilePage);
router.get("/myReviews", isLoggedIn, optionController.renderMyReviewsPage);
router.get("/myListings", isLoggedIn, optionController.renderMyListingPage);
router.get("/myBookings", isLoggedIn, optionController.renderMyBookingsPage);
router.put(
  "/updateProfile",

  isLoggedIn,

  upload.single("profilePicture"),

  // 4. Run the Controller Logic
  optionController.updateProfile
);
router.delete("/deleteUser", isLoggedIn, optionController.deleteUser);

module.exports = router;
