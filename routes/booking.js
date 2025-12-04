const express = require("express");
const router = express.Router({ mergeParams: true });
const bookingController = require("../controllers/booking.js");
// ^ Make sure this path points to where you saved the code you just showed me.

// Middleware to check if user is logged in (Assuming you have this)
const { isLoggedIn, isVerified } = require("../middleware.js");

// ---------------------------------------------------------
// ROUTE 1: Create Order
// This is called when the user clicks "Proceed to Payment"
// ---------------------------------------------------------
router.post(
  "/create-order",
  isLoggedIn,
  isVerified,
  bookingController.createOrder
);

// ---------------------------------------------------------
// ROUTE 2: Verify Payment
// This is called AUTOMATICALLY by the Razorpay script after payment succeeds
// ---------------------------------------------------------
router.post(
  "/verify-payment",
  isLoggedIn,
  isVerified,
  bookingController.verifyPayment
);
// ... existing routes

// Route to render the success page
// URL: /listings/:id/booking/:bookingId/success
router.get(
  "/:bookingId/success",
  isLoggedIn,
  isVerified,
  bookingController.confirmationPage
);
module.exports = router;
