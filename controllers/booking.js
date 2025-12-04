const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking"); // Import your Booking model
const { sendTicketPdf } = require("../utils/sendPdf.js");
const transporter = require("../config/nodemail.js");
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

const nodemailer = require("nodemailer"); // Ensure this is required at the top

module.exports.confirmationPage = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    // FIX 1: Use Nested Populate to get the Owner object
    const booking = await Booking.findById(bookingId).populate({
      path: "listing",
      populate: { path: "owner" }, // This fetches the actual User object
    });

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/listings");
    }

    // FIX 2: Safety Check - Ensure the owner actually exists before sending
    if (!booking.listing.owner || !booking.listing.owner.email) {
      console.log("Owner email not found, skipping email notification.");
      // We don't return here because we still want to show the success page to the user
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.listing.owner.email,
        subject: `New Booking for ${booking.listing.title}!`,
        html: `
            <h3>Hello ${booking.listing.owner.username},</h3>
            <p>Great news! Your listing <b>${
              booking.listing.title
            }</b> has been booked.</p>
            <ul>
              <li><b>Booked by:</b> ${
                req.user ? req.user.username : "A guest"
              }</li>
              <li><b>Booking ID:</b> ${booking._id}</li>
            </ul>
            <p>Please check your dashboard for full details.</p>
          `,
      };

      // It's often safer to await this or use a callback to catch email errors specifically
      // await transporter.sendMail(mailOptions);

      transporter.sendMail(mailOptions).catch((err) => {
        console.log("Failed to send email:", err);
      });

      console.log("Email process started (background)...");

      console.log("Email sent to owner!");
    }

    res.render("listings/bookingConfirm.ejs", { booking });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
};
