const express = require("express");
const router = express.Router();
const {
  listingSchema,
  searchSchema,
  searchSuggestionSchema,
  multerSizehandler,
} = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateSearch,
  isVerified,
} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer"); //to parse form data
const { storage } = require("../cloudConfig.js");
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
});

router
  .route("/")
  .get(listingController.index)
  .post(
    isLoggedIn,
    validateListing,
    upload.single("image"),
    listingController.createListing,
    listingController.multerSizehandler
  );

router.get(
  "/search",
  validateSearch(searchSchema, "query"),
  listingController.search
);

//New Route
router.get("/new", isLoggedIn, isVerified, listingController.renderNewForm);

router
  .route("/:id")
  .get(listingController.showListing)
  .put(
    isLoggedIn,
    isOwner,
    upload.single("image"),
    validateListing,
    listingController.editListing,
    listingController.multerSizehandler
  )
  .delete(isLoggedIn, isOwner, listingController.deleteListing);

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, listingController.renderEditForm);

router.get(
  "/:id/book",
  isLoggedIn,
  isVerified,
  listingController.renderBookingDetailsPage
);

module.exports = router;
