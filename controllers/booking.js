const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking"); // Import your Booking model
const { sendTicketPdf } = require("../utils/sendPdf.js");
// Initialize Razorpay with your API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: amount * 100, // Razorpay works in smallest currency unit (paise for INR), so multiply by 100
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
module.exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingDetails,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    try {
      // 1. Create the Booking
      const newBooking = new Booking({
        listing: bookingDetails.listingId,
        traveler: bookingDetails.userId,
        checkIn: new Date(bookingDetails.checkIn),
        checkOut: new Date(bookingDetails.checkOut),
        numberOfGuests: bookingDetails.numberOfGuests,
        totalPrice: bookingDetails.totalPrice,
        paymentDetails: {
          paymentId: razorpay_payment_id,
          status: "paid",
        },
        status: "confirmed",
      });

      await newBooking.save();

      // 2. Populate Listing Details (Required for PDF)
      // Note: We don't need to await User.findById(req.user._id)
      const populatedBooking = await newBooking.populate("listing");

      // 3. Send Email using req.user directly
      // Ensure 'req.user' exists (Passport middleware should handle this, but good to know)
      if (req.user) {
        sendTicketPdf(populatedBooking, req.user);
      }

      res.json({
        success: true,
        message: "Payment verified and Booking confirmed",
        bookingId: newBooking._id,
        // Make sure this URL matches your route structure exactly
        redirectUrl: `/listings/${bookingDetails.listingId}/${newBooking._id}/success`,
      });
    } catch (dbError) {
      console.error("Database Error:", dbError);
      // In a real app, you might want to issue a refund here if DB save fails after payment
      res.status(500).json({ success: false, message: "Booking save failed" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid Signature" });
  }
};

module.exports.confirmationPage = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    // We need to populate the 'listing' to show title and image on success page
    const booking = await Booking.findById(bookingId).populate("listing");

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/listings");
    }

    res.render("listings/bookingConfirm.ejs", { booking });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
};
