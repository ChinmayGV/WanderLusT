const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    // Reference to the Listing being booked
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Reference to the User who is booking
    traveler: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: [1, "At least one guest is required"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Status of the booking request
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    // Payment tracking (crucial for e-commerce)
    paymentDetails: {
      paymentId: { type: String }, // e.g., from Stripe/Razorpay
      status: {
        type: String,
        enum: ["unpaid", "paid", "failed", "refunded"],
        default: "unpaid",
      },
    },
    // Optional: A message from the traveler to the host
    message: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Middleware: Ensure check-out is after check-in before saving
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    const err = new Error("Check-out date must be after check-in date.");
    next(err);
  } else {
    next();
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
