# Wanderlust Project - Complete Line-by-Line Explanation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Main Entry Point (app.js)](#main-entry-point-appjs)
4. [Database Models](#database-models)
5. [Controllers](#controllers)
6. [Routes](#routes)
7. [Middleware](#middleware)
8. [Configuration Files](#configuration-files)
9. [Utilities](#utilities)
10. [Frontend Structure](#frontend-structure)

---

## Project Overview

**Wanderlust** is a full-stack Airbnb-inspired web application built with Node.js and Express.js. It allows users to:
- Create and manage property listings
- Book stays at properties
- Leave reviews and ratings
- Manage user profiles
- Search and filter listings
- Process payments via Razorpay

**Tech Stack:**
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Passport.js with Local Strategy
- **View Engine:** EJS (Embedded JavaScript Templates)
- **File Upload:** Multer with Cloudinary storage
- **Payment:** Razorpay
- **Email:** Nodemailer
- **Maps:** Leaflet with OpenCage Geocoding API

---

## Project Structure

```
Wanderlust/
├── app.js                 # Main entry point
├── schema.js              # Joi validation schemas
├── middleware.js          # Custom middleware functions
├── cloudConfig.js         # Cloudinary configuration
├── package.json           # Dependencies and scripts
├── models/                # Mongoose schemas
│   ├── user.js
│   ├── listing.js
│   ├── review.js
│   └── booking.js
├── controllers/           # Business logic
│   ├── users.js
│   ├── listings.js
│   ├── reviews.js
│   ├── booking.js
│   └── options.js
├── routes/                # Express routes
│   ├── user.js
│   ├── listing.js
│   ├── review.js
│   ├── booking.js
│   ├── options.js
│   └── terms&policy.js
├── views/                 # EJS templates
├── public/                # Static files (CSS, JS, images)
├── config/                # Configuration files
│   └── nodemail.js
├── utils/                 # Utility functions
│   ├── ExpressError.js
│   ├── sendPdf.js
│   └── countries.js
└── init/                  # Database initialization
    ├── index.js
    └── data.js
```

---

## Main Entry Point (app.js)

### Line-by-Line Breakdown:

**Lines 1-3:** Environment Configuration
```javascript
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
```
- Checks if the app is NOT in production mode
- If not production, loads environment variables from `.env` file
- This allows local development without exposing secrets

**Lines 5-24:** Core Dependencies Import
```javascript
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 3333;
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const termsRouter = require("./routes/terms&policy.js");
const optionRouter = require("./routes/options.js");
const bookingRouter = require("./routes/booking.js");
```
- **express:** Web framework for Node.js
- **app:** Express application instance
- **mongoose:** MongoDB object modeling tool
- **port:** Server port (3333)
- **path:** Node.js path module for file paths
- **methodOverride:** Allows HTML forms to use PUT/DELETE methods
- **ejsMate:** EJS template engine with layouts support
- **ExpressError:** Custom error class
- **express-session:** Session management middleware
- **connect-mongo:** MongoDB session store
- **connect-flash:** Flash messages for user feedback
- **passport:** Authentication middleware
- **passport-local:** Local username/password strategy
- **User:** User model
- **Routers:** Imported route handlers

**Lines 26-37:** Database Connection
```javascript
const mongourl = process.env.ATLAS_DB_URL;
main()
  .then((res) => {
    console.log("connected successfully to DB");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(mongourl);
}
```
- Gets MongoDB connection URL from environment variables
- Connects to MongoDB Atlas (cloud database)
- Uses async/await pattern for connection
- Logs success or error messages

**Lines 39-45:** View Engine & Static Files Setup
```javascript
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
```
- Sets EJS as the view engine
- Sets views directory path
- Serves static files from `/public` directory
- Parses URL-encoded form data
- Parses JSON request bodies
- Enables method override for PUT/DELETE
- Configures ejsMate for layout support

**Lines 47-59:** Session Store Configuration
```javascript
const store = MongoStore.create({
  mongoUrl: mongourl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

store.on("error", () => {
  console.log("ERROR in mongo session store");
});
```
- Creates MongoDB session store
- Encrypts session data using SECRET from .env
- `touchAfter`: Only updates session if older than 24 hours
- Sets connection timeouts
- Error handler for session store failures

**Lines 61-71:** Session Configuration
```javascript
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
```
- **store:** MongoDB session store
- **secret:** Encryption key for session data
- **resave:** Don't save session if unchanged
- **saveUninitialized:** Save new sessions even if empty
- **cookie.expires:** Cookie expiration (7 days)
- **cookie.maxAge:** Maximum age in milliseconds (7 days)
- **cookie.httpOnly:** Prevents JavaScript access (security)

**Lines 73-76:** Current Path Middleware
```javascript
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});
```
- Adds current request path to `res.locals` for use in templates
- Useful for highlighting active navigation items

**Lines 78-81:** Root Route
```javascript
app.get("/", (req, res) => {
  res.redirect("/listings");
});
```
- Redirects root URL to listings page

**Lines 83-88:** Session & Flash Middleware
```javascript
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
```
- Initializes session middleware
- Initializes flash messages
- Initializes Passport authentication
- Initializes Passport session support
- Uses LocalStrategy with User.authenticate() method (from passport-local-mongoose)

**Lines 107-108:** Passport Serialization
```javascript
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
```
- **serializeUser:** Stores user ID in session
- **deserializeUser:** Retrieves user object from session
- Both methods provided by passport-local-mongoose

**Lines 110-115:** Flash Messages & Current User Middleware
```javascript
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});
```
- Makes flash messages available in all templates
- Makes current user (if logged in) available in all templates
- `req.user` is set by Passport when authenticated

**Lines 117-135:** User Listings Check Middleware
```javascript
const Listing = require("./models/listing");

app.use(async (req, res, next) => {
  try {
    if (req.user) {
      const userListings = await Listing.find({ owner: req.user._id });
      res.locals.hasListings = userListings.length > 0;
    } else {
      res.locals.hasListings = false;
    }
    next();
  } catch (err) {
    next(err);
  }
});
```
- Checks if logged-in user owns any listings
- Sets `hasListings` flag for navbar display
- Used to show/hide "My Listings" link

**Lines 137-147:** Demo User Route (Testing)
```javascript
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "student@33gmail.com",
    username: "deepansh",
  });
  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});
```
- Test route to create a demo user
- Uses passport-local-mongoose's `register()` method
- Automatically hashes password

**Lines 148-153:** Route Mounting
```javascript
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/terms", termsRouter);
app.use("/", optionRouter);
app.use("/listings/:id", bookingRouter);
```
- Mounts route handlers
- `/listings` - listing CRUD operations
- `/listings/:id/reviews` - review operations
- `/` - user authentication routes
- `/terms` - terms and policy page
- `/` - user options (profile, bookings, etc.)
- `/listings/:id` - booking routes

**Lines 155-157:** 404 Handler
```javascript
app.all(/.*/, (req, res) => {
  throw new ExpressError(404, "Page Not Found");
});
```
- Catches all unmatched routes
- Throws 404 error

**Lines 159-163:** Error Handler Middleware
```javascript
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.render("error.ejs", { err, statusCode, message });
});
```
- Global error handler
- Extracts status code and message from error
- Renders error page with error details

**Lines 165-167:** Server Start
```javascript
app.listen(port, () => {
  console.log(`Server is Listening to the Port:${port}`);
});
```
- Starts Express server on port 3333
- Logs confirmation message

---

## Database Models

### models/user.js

**Lines 1-3:** Imports
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
```
- Mongoose for MongoDB modeling
- Schema constructor
- Plugin for username/password authentication

**Lines 5-54:** User Schema Definition
```javascript
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  profilePicture: {
    type: String,
  },
  profilePictureId: {
    type: String,
  },
  age: {
    type: Number,
    min: [1, "Age must be positive"],
    max: [120, "Enter a valid age"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
  },
  preferences: [
    {
      type: String,
    },
  ],
  resetToken: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
});
```
- **email:** Unique, required email address
- **isVerified:** Email verification status (default: false)
- **emailVerificationToken:** Token for email verification
- **emailVerificationExpires:** Token expiration time
- **profilePicture:** URL to profile picture (Cloudinary)
- **profilePictureId:** Cloudinary image ID for deletion
- **age:** User age with validation (1-120)
- **gender:** Enum with three options
- **phone:** 10-digit phone number with regex validation
- **preferences:** Array of user preferences (categories)
- **resetToken:** Password reset token
- **resetTokenExpires:** Reset token expiration

**Line 56:** Plugin Application
```javascript
userSchema.plugin(passportLocalMongoose);
```
- Adds username, hash, salt fields automatically
- Adds methods: `register()`, `authenticate()`, `serializeUser()`, `deserializeUser()`

**Line 59:** Model Export
```javascript
module.exports = mongoose.model("User", userSchema);
```
- Creates and exports User model

### models/listing.js

**Lines 1-3:** Imports
```javascript
const mongoose = require("mongoose");
const Review = require("./review.js");
const Schema = mongoose.Schema;
```

**Lines 5-72:** Listing Schema
```javascript
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    filename: { type: String },
    url: { type: String },
  },
  price: {
    type: Number,
  },
  category: {
    type: [String],
    enum: [
      "Trending", "Rooms", "Mountains", "Iconic Cities",
      "Castles", "Pools", "Camping", "Farms",
      "Arctic", "Boats", "Domes", "Beaches",
      "Luxury", "Wildlife", "Adventure"
    ],
  },
  location: {
    type: String,
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  country: {
    type: String,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});
```
- **title:** Listing title (required)
- **description:** Property description
- **image:** Object with filename (Cloudinary ID) and URL
- **price:** Rental price per night
- **category:** Array of categories (enum values)
- **location:** Location string (e.g., "New York City")
- **geometry:** GeoJSON Point for map display (longitude, latitude)
- **country:** Country name
- **reviews:** Array of Review ObjectIds (references)
- **owner:** User ObjectId who owns the listing

**Lines 82-83:** Model Export
```javascript
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
```

### models/review.js

**Lines 1-3:** Imports
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
```

**Lines 4-23:** Review Schema
```javascript
const revieSchema = new Schema({
  comment: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
  },
});
```
- **comment:** Review text
- **rating:** 1-5 star rating
- **createdAt:** Timestamp (default: now)
- **author:** User who wrote the review
- **listing:** Listing being reviewed

**Line 24:** Model Export
```javascript
module.exports = mongoose.model("Review", revieSchema);
```

### models/booking.js

**Lines 1-3:** Imports
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
```

**Lines 4-58:** Booking Schema
```javascript
const bookingSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
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
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentDetails: {
      paymentId: { type: String },
      status: {
        type: String,
        enum: ["unpaid", "paid", "failed", "refunded"],
        default: "unpaid",
      },
    },
    message: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);
```
- **listing:** Reference to Listing
- **traveler:** User making the booking
- **checkIn:** Check-in date
- **checkOut:** Check-out date
- **numberOfGuests:** Number of guests (min: 1)
- **totalPrice:** Total booking price
- **status:** Booking status enum
- **paymentDetails:** Payment information object
- **message:** Optional message to host
- **timestamps:** Adds createdAt and updatedAt automatically

**Lines 61-68:** Pre-Save Validation
```javascript
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    const err = new Error("Check-out date must be after check-in date.");
    next(err);
  } else {
    next();
  }
});
```
- Validates check-out is after check-in before saving
- Prevents invalid date ranges

**Lines 70-72:** Model Export
```javascript
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
```

---

## Controllers

### controllers/users.js

**Lines 1-4:** Imports
```javascript
const User = require("../models/user.js");
const crypto = require("crypto");
const transporter = require("../config/nodemail.js");
const bcrypt = require("bcrypt");
```
- User model
- crypto for token generation
- Nodemailer transporter
- bcrypt for password hashing (though passport-local-mongoose handles this)

**Lines 7-9:** Render Signup Form
```javascript
module.exports.renderSignUp = (req, res) => {
  res.render("users/signup.ejs");
};
```
- Renders signup page

**Lines 11-60:** Signup Handler
```javascript
module.exports.signup = async (req, res) => {
  try {
    let { username, password, email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "User with this Email already Exists .");
      return res.redirect("/signup");
    }

    // Create new user
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    // Generate verification token
    const token = crypto.randomBytes(20).toString("hex");
    registeredUser.emailVerificationToken = token;
    registeredUser.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    await registeredUser.save();

    // Create verification link
    const verificationLink = `http://${req.headers.host}/verify-email?token=${token}`;

    // Send verification email
    await transporter.sendMail({
      to: registeredUser.email,
      from: `<${process.env.EMAIL_USER}>`,
      subject: "Verify Your Email for Wanderlust",
      html: `...`,
    });

    req.flash("success", "click on the link sent to your email");
    res.render("partials/renderEmail.ejs", { process: "verify" });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};
```
- Validates email uniqueness
- Registers user (hashes password automatically)
- Generates verification token (20 random bytes, hex encoded)
- Sets token expiration (1 hour)
- Sends verification email with link
- Shows email sent confirmation page

**Lines 63-72:** Login Handler
```javascript
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome  ${req.body.username} `);
  let redirectUrl = "/listings";
  res.redirect(redirectUrl);
};
```
- Renders login form
- After Passport authentication succeeds, redirects to listings
- Shows welcome message

**Lines 74-82:** Logout Handler
```javascript
module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out");
    res.redirect("/listings");
  });
};
```
- Logs out user (destroys session)
- Shows logout success message
- Redirects to listings

**Lines 84-120:** Email Verification Handler
```javascript
module.exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Verification token is invalid or has expired.");
      return res.redirect("/login");
    }

    // Verify user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Auto-login after verification
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Email Verification Successfull.");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", "Something went wrong.");
    res.redirect("/login");
  }
};
```
- Extracts token from query string
- Finds user with valid, non-expired token
- Marks user as verified
- Clears token fields
- Auto-logs in user after verification

**Lines 130-198:** Resend Verification Email
```javascript
module.exports.resendEmail = async (req, res, next) => {
  try {
    const { email: newEmail } = req.body;
    const user = await User.findById(req.user._id);

    // Check if new email is different
    if (newEmail && newEmail !== user.email) {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser && !existingUser._id.equals(user._id)) {
        req.flash("error", "A user with this new email already exists.");
        return res.redirect("/resend-verification-link");
      }
      user.email = newEmail;
      user.isEmailVerified = false;
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 3600000;
    await user.save();

    // Send email
    const verificationLink = `http://${req.headers.host}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({...});

    req.flash("success", `Verification link sent to ${user.email}.`);
    res.render("partials/renderEmail.ejs", { process: "reverify" });
  } catch (e) {
    next(e);
  }
};
```
- Allows changing email or resending verification
- Validates new email uniqueness
- Generates new token
- Sends verification email

**Lines 200-251:** Forgot Password Handler
```javascript
module.exports.submitForgotPassForm = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "This mail is not registered");
      return res.redirect("/signup");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = Date.now() + 3600000; // 1 hour

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(tokenExpiration);
    await user.save();

    // Send reset email
    const resetURL = `http://localhost:3333/reset-password?token=${resetToken}`;
    await transporter.sendMail({...});

    res.render("partials/renderEmail.ejs", { process: "reset" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error." });
  }
};
```
- Finds user by email
- Generates reset token (32 bytes)
- Sets expiration (1 hour)
- Sends reset link via email

**Lines 253-283:** Render Reset Password Form
```javascript
module.exports.renderResetForgotForm = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      req.flash("error", "Missing password reset token.");
      return res.redirect("/forgot-password");
    }

    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset link is invalid or has expired.");
      return res.redirect("/forgot-password");
    }

    res.render("users/resetPassword.ejs", { token: token });
  } catch (error) {
    console.error("GET Reset Password Error:", error);
    res.render("error", { message: "An unexpected error occurred." });
  }
};
```
- Validates token exists
- Finds user with valid token
- Renders reset password form with token

**Lines 305-347:** Reset Password Handler
```javascript
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      req.flash("error", "confirm password is not same as new password");
      res.redirect("/forgot-password");
    }

    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset link is invalid or has expired.");
      res.redirect("/forgot-password");
    }

    // Use passport-local-mongoose method to set password
    await user.setPassword(password);

    // Clear token fields
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    req.flash("success", "password change successfully!");
    res.redirect("/login");
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
};
```
- Validates password confirmation match
- Finds user with valid token
- Uses `setPassword()` method (from passport-local-mongoose) to hash and save password
- Clears reset token
- Redirects to login

### controllers/listings.js

**Lines 1-8:** Imports
```javascript
const countryList = require("../utils/countries.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const multer = require("multer");
const ExpressError = require("../utils/ExpressError.js");
const axios = require("axios");
const Fuse = require("fuse.js");
const { cloudinary } = require("../cloudConfig.js");
```
- Country list utility
- Listing model
- User model
- Multer for file uploads
- Custom error class
- Axios for HTTP requests (geocoding API)
- Fuse.js for fuzzy search
- Cloudinary for image management

**Lines 12-135:** Index Page Handler (List All Listings)
```javascript
module.exports.index = async (req, res) => {
  const { category, sort, country } = req.query;

  // Build filters
  let filter = {};

  // Category filter (supports single or multiple)
  let selectedCategories = [];
  if (!category) {
    selectedCategories = [];
  } else if (typeof category === "string") {
    selectedCategories = [category];
  } else {
    selectedCategories = category;
  }
  if (selectedCategories.length > 0) {
    filter.category = { $in: selectedCategories };
  }

  // Country filter
  let selectedCountries = [];
  if (!country) selectedCountries = [];
  else if (typeof country === "string") selectedCountries = [country];
  else selectedCountries = country;

  if (selectedCountries.length > 0) {
    const regexCountries = selectedCountries.map((c) => new RegExp(c, "i"));
    filter.country = { $in: regexCountries };
  }

  // Sorting
  let priceSort = null;
  if (sort === "price_asc") priceSort = { price: 1 };
  else if (sort === "price_desc") priceSort = { price: -1 };

  const filtersApplied = selectedCategories.length > 0 || sort || selectedCountries.length > 0;

  // User NOT logged in → show all listings
  if (!req.user) {
    let allListings = await Listing.find(filter).sort(priceSort);
    if (allListings.length === 0) {
      req.flash("error", "No listing found for your filter");
      return res.redirect("/listings");
    }
    return res.render("./listings/index.ejs", {
      allListings,
      currentCategory: selectedCategories,
      allCountries: countryList,
      selectedCountries,
      selectedSort: sort || "",
    });
  }

  // Logged in user
  const user = await User.findById(req.user._id);
  const preferences = user.preferences || [];

  // If filters applied → ignore preferences
  if (filtersApplied) {
    let allListings = await Listing.find(filter).sort(priceSort);
    if (allListings.length === 0) {
      req.flash("error", "No listing found for your filter");
      return res.redirect("/listings");
    }
    return res.render("./listings/index.ejs", {...});
  }

  // No filters AND user has preferences → preference sorting
  if (preferences.length > 0) {
    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          matchScore: {
            $size: { $setIntersection: ["$category", preferences] },
          },
        },
      },
      { $sort: { matchScore: -1 } },
    ];
    let allListings = await Listing.aggregate(pipeline);
    allListings.forEach((l) => delete l.matchScore);
    return res.render("./listings/index.ejs", {...});
  }

  // No preferences → normal listing
  let allListings = await Listing.find(filter).sort(priceSort);
  res.render("./listings/index.ejs", {...});
};
```
- Handles filtering by category and country
- Supports price sorting (ascending/descending)
- For logged-in users: prioritizes listings matching their preferences
- Uses MongoDB aggregation for preference matching
- Renders listings index page

**Lines 138-172:** Search Handler
```javascript
module.exports.search = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.redirect("/listings");
    }

    const allListings = await Listing.find({});

    const options = {
      keys: ["title", "location", "country"],
      includeScore: true,
      threshold: 0.2,
    };

    const fuse = new Fuse(allListings, options);
    const results = fuse.search(query);
    const searchResults = results.map((result) => result.item);

    if (searchResults.length === 0) {
      req.flash("error", "No listings found matching that search.");
      return res.redirect("/listings");
    }

    res.render("listings/index.ejs", {
      allListings: searchResults,
      query: query,
      currentCategory: [],
      selectedCountries: [],
      selectedSort: "",
    });
  } catch (err) {
    console.error(err);
  }
};
```
- Uses Fuse.js for fuzzy search
- Searches in title, location, and country fields
- Threshold 0.2 means 80% similarity required
- Returns matching listings

**Lines 175-193:** Show Listing Handler
```javascript
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};
```
- Finds listing by ID
- Populates reviews with author details (nested populate)
- Populates owner information
- Renders show page

**Lines 197-235:** Create Listing Handler
```javascript
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;
  const locationString = req.body.location;

  // Geocode location using OpenCage API
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json`;
  const params = {
    q: locationString,
    key: process.env.OPENCAGE_MAP_TOKEN,
    limit: 1,
  };

  const response = await axios.get(geocodeUrl, { params });
  const geometry = response.data.results[0].geometry;

  const newListingData = req.body;

  await Listing.create({
    ...newListingData,
    image: {
      filename: filename,
      url: url,
    },
    geometry: {
      type: "Point",
      coordinates: [geometry.lng, geometry.lat],
    },
    owner: req.user._id,
  });

  req.flash("success", "New Listing Created (:");
  res.redirect("/listings");
};
```
- Renders new listing form
- Gets uploaded image URL and filename from Multer
- Geocodes location string to get coordinates
- Creates listing with image and geometry
- Sets owner to current user

**Lines 238-294:** Edit Listing Handler
```javascript
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const newListingData = req.body;
  const locationString = req.body.location;

  // Geocode new location
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json`;
  const params = {
    q: locationString,
    key: process.env.OPENCAGE_MAP_TOKEN,
    limit: 1,
  };
  const response = await axios.get(geocodeUrl, { params });
  const geometry = response.data.results[0].geometry;

  // Update listing
  let result = await Listing.findByIdAndUpdate(
    id,
    {
      ...newListingData,
      geometry: {
        type: "Point",
        coordinates: [geometry.lng, geometry.lat],
      },
    },
    { runValidators: true }
  );

  // If new image uploaded, update image
  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    await Listing.findByIdAndUpdate(
      id,
      {
        ...newListingData,
        image: {
          filename: filename,
          url: url,
        },
        geometry: {
          type: "Point",
          coordinates: [geometry.lng, geometry.lat],
        },
      },
      { runValidators: true }
    );
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};
```
- Renders edit form with existing listing data
- Updates listing with new data
- Re-geocodes location if changed
- Updates image if new file uploaded

**Lines 297-307:** Delete Listing Handler
```javascript
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);

  if (deletedListing.image && deletedListing.image.filename) {
    await cloudinary.uploader.destroy(deletedListing.image.filename);
  }
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
```
- Deletes listing from database
- Deletes image from Cloudinary
- Shows success message

**Lines 309-316:** Multer File Size Error Handler
```javascript
module.exports.multerSizehandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    req.flash("error", "File is too large. Maximum size is 5MB.");
    return res.redirect("/listings/new");
  }
  throw new ExpressError(400, error.message);
};
```
- Handles file size limit errors
- Shows user-friendly error message

**Lines 320-353:** Booking Handlers
```javascript
module.exports.renderBookingDetailsPage = async (req, res) => {
  let { id } = req.params;
  res.render("listings/book.ejs", { id });
};

module.exports.renderCheckoutPage = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  let { checkIn, checkOut, guests } = req.query;
  let cIn = new Date(checkIn);
  let cOut = new Date(checkOut);

  if (cIn > cOut) {
    req.flash("error", "check-in date cannot be after check-out date ");
    return res.redirect(`/listings/${id}/book`);
  }

  const diffDays = (cOut - cIn) / (1000 * 60 * 60 * 24);

  if (diffDays > 30) {
    req.flash("error", "you can't book for more than 30 days");
    return res.redirect(`/listings/${id}/book`);
  }

  res.render("listings/checkout", {
    checkIn,
    checkOut,
    guests,
    diffDays,
    listing,
  });
};
```
- Renders booking form
- Validates dates (check-in before check-out)
- Limits booking to 30 days maximum
- Calculates number of days
- Renders checkout page with booking details

### controllers/reviews.js

**Lines 1-16:** Create Review
```javascript
module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user;
  newReview.listing = listing._id;

  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  req.flash("success", "thank's for providing your review (:");
  res.redirect(`/listings/${req.params.id}`);
};
```
- Creates new review
- Sets author to current user
- Links review to listing
- Adds review to listing's reviews array
- Saves both review and listing

**Lines 18-27:** Delete Review
```javascript
module.exports.deleteReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  let redirectUrl = req.query.redirect_to || `/listings/${id}`;
  res.redirect(redirectUrl);
};
```
- Removes review from listing's reviews array using `$pull`
- Deletes review document
- Redirects to listing page

### controllers/booking.js

**Lines 1-10:** Razorpay Setup
```javascript
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking");
const { sendTicketPdf } = require("../utils/sendPdf.js");
const transporter = require("../config/nodemail.js");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```
- Initializes Razorpay payment gateway
- Imports booking model and PDF utility

**Lines 12-32:** Create Order
```javascript
module.exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: amount * 100, // Convert to paise (smallest currency unit)
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
```
- Creates Razorpay order
- Converts amount to paise (multiply by 100)
- Returns order details to frontend

**Lines 33-94:** Verify Payment
```javascript
module.exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingDetails,
  } = req.body;

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    try {
      // Create booking
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

      // Populate listing for PDF
      const populatedBooking = await newBooking.populate("listing");

      // Send PDF ticket via email
      if (req.user) {
        sendTicketPdf(populatedBooking, req.user);
      }

      res.json({
        success: true,
        message: "Payment verified and Booking confirmed",
        bookingId: newBooking._id,
        redirectUrl: `/listings/${bookingDetails.listingId}/${newBooking._id}/success`,
      });
    } catch (dbError) {
      console.error("Database Error:", dbError);
      res.status(500).json({ success: false, message: "Booking save failed" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid Signature" });
  }
};
```
- Verifies payment signature using HMAC SHA256
- Creates booking record if payment authentic
- Sends PDF ticket via email
- Returns success response with redirect URL

**Lines 98-163:** Confirmation Page
```javascript
module.exports.confirmationPage = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    // Populate listing and owner
    const booking = await Booking.findById(bookingId).populate({
      path: "listing",
      populate: { path: "owner" },
    });

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/listings");
    }

    // Send email notification to listing owner
    if (booking.listing.owner && booking.listing.owner.email) {
      const transporter = nodemailer.createTransport({...});
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.listing.owner.email,
        subject: `New Booking for ${booking.listing.title}!`,
        html: `...`,
      };
      transporter.sendMail(mailOptions).catch((err) => {
        console.log("Failed to send email:", err);
      });
    }

    res.render("listings/bookingConfirm.ejs", { booking });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
};
```
- Fetches booking with populated listing and owner
- Sends email notification to listing owner
- Renders confirmation page

### controllers/options.js

**Lines 8-11:** Render Profile Page
```javascript
module.exports.renderMyProfilePage = (req, res) => {
  let user = req.user;
  res.render("options/profile.ejs", { currUser: user });
};
```

**Lines 13-149:** Update Profile
```javascript
module.exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let { username, age, gender, phone, preferences, removePicture, email } = req.body;
    const userToUpdate = await User.findById(userId);

    // Check username uniqueness
    if (username !== userToUpdate.username) {
      const existingUser = await User.findOne({ username: username });
      if (existingUser) {
        req.flash("error", "That username is already taken.");
        return res.redirect("/myProfile");
      }
    }

    // Handle email change
    let emailChanged = false;
    if (email && email.trim() !== "" && email !== userToUpdate.email) {
      const existingUserWithNewEmail = await User.findOne({ email });
      if (existingUserWithNewEmail && !existingUserWithNewEmail._id.equals(userId)) {
        req.flash("error", "That email address is already registered.");
        return res.redirect("/myProfile");
      }

      // Check if user has listings (can't change email if they do)
      const listingCount = await Listing.countDocuments({ owner: req.user._id });
      if (listingCount > 0) {
        req.flash("error", "Delete listings before changing email.");
        return res.redirect("/myProfile");
      }
      emailChanged = true;
    }

    // Build update data
    let updateData = {
      username: username,
      email: email,
      age: age,
      gender: gender,
      phone: phone,
      preferences: preferences ? (Array.isArray(preferences) ? preferences : [preferences]) : [],
    };

    // Reset verification if email changed
    if (emailChanged) {
      updateData.isVerified = false;
      updateData.emailVerificationToken = null;
      updateData.emailVerificationExpires = null;
    }

    // Handle profile picture
    if (removePicture === "true") {
      if (userToUpdate.profilePictureId) {
        await cloudinary.uploader.destroy(userToUpdate.profilePictureId);
      }
      updateData.profilePicture = null;
      updateData.profilePictureId = null;
    } else if (req.file) {
      updateData.profilePicture = req.file.path;
      updateData.profilePictureId = req.file.filename;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    // Re-login with updated user
    req.login(updatedUser, (err) => {
      if (err) {
        return next(err);
      }
      let successMessage = "Profile updated successfully!";
      if (emailChanged) {
        successMessage += " Verify Email ";
      }
      req.flash("success", successMessage);
      res.redirect("/myProfile");
    });
  } catch (e) {
    req.flash("error", "An error occurred.");
    res.redirect("/myProfile");
  }
};
```
- Validates username and email uniqueness
- Prevents email change if user has listings
- Handles profile picture upload/removal
- Resets email verification if email changed
- Re-logs in user with updated session

**Lines 152-155:** Render My Reviews
```javascript
module.exports.renderMyReviewsPage = async (req, res) => {
  let reviews = await Review.find({ author: req.user._id }).populate("listing");
  res.render("options/myreviews.ejs", { reviews });
};
```

**Lines 158-190:** Delete User
```javascript
module.exports.deleteUser = async (req, res, next) => {
  const userId = req.user._id;
  try {
    // Delete all user's listings
    await Listing.deleteMany({ owner: userId });

    // Delete all user's reviews
    await Review.deleteMany({ author: userId });

    // Delete all user's bookings
    await Booking.deleteMany({ traveler: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    // Logout
    req.logout((err) => {
      if (err) return next(err);
      req.flash("success", "Your account has been successfully deleted.");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", "Error deleting account.");
    res.redirect("/myProfile");
  }
};
```
- Cascades deletion: listings, reviews, bookings
- Deletes user account
- Logs out user

**Lines 193-203:** Render My Listings
```javascript
module.exports.renderMyListingPage = async (req, res) => {
  try {
    let listings = await Listing.find({ owner: req.user._id });
    res.render("options/mylistings.ejs", { listings });
  } catch (err) {
    req.flash("error", "Could not load your listings.");
    res.redirect("/");
  }
};
```

**Lines 205-212:** Render My Bookings
```javascript
module.exports.renderMyBookingsPage = async (req, res) => {
  let myBookings = await Booking.find({ traveler: req.user._id }).populate("listing");
  res.render("options/mybookings.ejs", { myBookings });
};
```

---

## Routes

### routes/user.js

**Lines 1-12:** Setup
```javascript
const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const {
  saveRedirectUrl,
  isLoggedIn,
  checkIfUserLoggedIn,
} = require("../middleware.js");
const { validateUser } = require("../middleware.js");
const userController = require("../controllers/users.js");
```

**Lines 14-17:** Signup Routes
```javascript
router
  .route("/signup")
  .get(userController.renderSignUp)
  .post(validateUser, userController.signup);
```
- GET: Render signup form
- POST: Create new user (with validation)

**Lines 19-29:** Login Routes
```javascript
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );
```
- GET: Render login form
- POST: Authenticate with Passport, redirect on failure

**Lines 32-44:** Email Verification Routes
```javascript
router.get("/verify-email", userController.verifyEmail);
router.get("/logout", userController.logout);
router.get("/email", userController.renderEmailPage);
router.get(
  "/resend-verification-link",
  isLoggedIn,
  userController.renderReVerifyEmailPage
);
router.post(
  "/resend-verification-link",
  isLoggedIn,
  userController.resendEmail
);
```

**Lines 46-54:** Password Reset Routes
```javascript
router
  .route("/forgot-password")
  .get(userController.renderForgotPasswordPage)
  .post(userController.submitForgotPassForm);

router
  .route("/reset-password")
  .get(userController.renderResetForgotForm)
  .post(userController.resetPassword);
```

### routes/listing.js

**Lines 1-28:** Setup
```javascript
const express = require("express");
const router = express.Router();
const {
  listingSchema,
  searchSchema,
  searchSuggestionSchema,
} = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateSearch,
  isVerified,
  eligibleToBook,
} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 3, // 3MB
  },
});
```
- Sets up Multer with Cloudinary storage
- File size limit: 3MB

**Lines 30-39:** Listings Routes
```javascript
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
```
- GET: List all listings
- POST: Create new listing (requires login, validation, image upload)

**Lines 41-45:** Search Route
```javascript
router.get(
  "/search",
  validateSearch(searchSchema, "query"),
  listingController.search
);
```

**Line 48:** New Listing Form
```javascript
router.get("/new", isLoggedIn, isVerified, listingController.renderNewForm);
```
- Requires login and email verification

**Lines 50-61:** Listing Detail Routes
```javascript
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
```
- GET: Show listing
- PUT: Update listing (requires ownership)
- DELETE: Delete listing (requires ownership)

**Line 64:** Edit Form
```javascript
router.get("/:id/edit", isLoggedIn, isOwner, listingController.renderEditForm);
```

**Lines 66-80:** Booking Routes
```javascript
router.get(
  "/:id/book",
  isLoggedIn,
  isVerified,
  eligibleToBook,
  listingController.renderBookingDetailsPage
);

router.get(
  "/:id/checkout",
  isLoggedIn,
  isVerified,
  eligibleToBook,
  listingController.renderCheckoutPage
);
```
- Requires login, verification, and eligibility (can't book own listing)

### routes/review.js

**Lines 1-12:** Setup
```javascript
const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {
  validateReview,
  isLoggedIn,
  isreviewAuthor,
  isVerified,
  eligibleToReview,
} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");
```
- `mergeParams: true` allows access to `:id` from parent route

**Lines 14-22:** Create Review
```javascript
router.post(
  "/",
  isLoggedIn,
  isVerified,
  validateReview,
  eligibleToReview,
  reviewController.createReview
);
```
- Requires login, verification, validation, and eligibility (can't review own listing)

**Lines 24-30:** Delete Review
```javascript
router.delete(
  "/:reviewId",
  isLoggedIn,
  isreviewAuthor,
  reviewController.deleteReview
);
```
- Requires login and ownership of review

### routes/booking.js

**Lines 1-7:** Setup
```javascript
const express = require("express");
const router = express.Router({ mergeParams: true });
const bookingController = require("../controllers/booking.js");
const { isLoggedIn, isVerified } = require("../middleware.js");
```

**Lines 13-18:** Create Order
```javascript
router.post(
  "/create-order",
  isLoggedIn,
  isVerified,
  bookingController.createOrder
);
```

**Lines 24-29:** Verify Payment
```javascript
router.post(
  "/verify-payment",
  isLoggedIn,
  isVerified,
  bookingController.verifyPayment
);
```

**Lines 34-39:** Success Page
```javascript
router.get(
  "/:bookingId/success",
  isLoggedIn,
  isVerified,
  bookingController.confirmationPage
);
```

### routes/options.js

**Lines 16-30:** Profile Routes
```javascript
router.get("/myProfile", optionController.renderMyProfilePage);
router.get("/myReviews", isLoggedIn, optionController.renderMyReviewsPage);
router.get("/myListings", isLoggedIn, optionController.renderMyListingPage);
router.get("/myBookings", isLoggedIn, optionController.renderMyBookingsPage);
router.put(
  "/updateProfile",
  isLoggedIn,
  upload.single("profilePicture"),
  optionController.updateProfile
);
router.delete("/deleteUser", isLoggedIn, optionController.deleteUser);
```

---

## Middleware

### middleware.js

**Lines 5-26:** isLoggedIn
```javascript
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    if (req.method === "GET") {
      req.session.redirectUrl = req.originalUrl;
    } else {
      req.session.redirectUrl = req.get("referer") || "/";
    }
    req.flash("error", "You must be signed in to perform that action!");
    return res.redirect("/login");
  }
  next();
};
```
- Checks if user is authenticated
- Saves redirect URL for GET requests
- Redirects to login if not authenticated

**Lines 28-33:** saveRedirectUrl
```javascript
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};
```
- Makes saved redirect URL available to templates

**Lines 35-43:** isOwner
```javascript
module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let newlisting = await Listing.findById(id);
  if (!newlisting.owner._id.equals(req.user._id)) {
    req.flash("error", "You are not the owner of the listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
```
- Verifies user owns the listing
- Compares ObjectIds using `.equals()`

**Lines 45-56:** validateListing
```javascript
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
```
- Validates request body against Joi schema
- Throws error if validation fails

**Lines 57-68:** validateReview
```javascript
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
```

**Lines 70-79:** validateUser
```javascript
module.exports.validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};
```

**Lines 81-89:** isreviewAuthor
```javascript
module.exports.isreviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review.author._id.equals(req.user._id)) {
    req.flash("error", "You don't have access to delete this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
```

**Lines 91-109:** validateSearch
```javascript
module.exports.validateSearch = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      req.flash("error", "search lenght should be below length 100");
      res.redirect("/listings");
      return;
    }
    req[property] = schema.validate(req[property]).value;
    next();
  };
};
```
- Higher-order function for search validation
- Validates query parameters

**Lines 113-127:** isVerified
```javascript
module.exports.isVerified = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isVerified) {
    return next();
  }
  if (req.isAuthenticated() && !req.user.isVerified) {
    return res.redirect("/resend-verification-link");
  }
  req.flash("error", "You must be signed in to do that.");
  res.redirect("/login");
};
```
- Ensures user is logged in AND verified
- Redirects to verification page if not verified

**Lines 129-140:** eligibleToReview
```javascript
module.exports.eligibleToReview = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You can't review your own listing!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
```
- Prevents users from reviewing their own listings

**Lines 142-153:** eligibleToBook
```javascript
module.exports.eligibleToBook = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You can't Book your own listing!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
```
- Prevents users from booking their own listings

**Lines 156-163:** checkIfUserLoggedIn
```javascript
module.exports.checkIfUserLoggedIn = async (req, res, next) => {
  if (!req.user.isVerified) {
    req.flash("error", "Email verification pending");
    res.redirect("/listings");
  } else {
    next();
  }
};
```

**Lines 165-176:** checkIfUserEligibleToChangeEmail
```javascript
module.exports.checkIfUserEligibleToChangeEmail = async (req, res, next) => {
  let listings = await Listing.find({ owner: req.user._id });
  if (listings.length === 0) {
    return next();
  }
  req.flash("error", "First delete all your listings to change your email");
  return res.redirect("/myProfile");
};
```
- Prevents email change if user has listings

---

## Configuration Files

### cloudConfig.js

**Lines 22-42:** Cloudinary Configuration
```javascript
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "WanderLusT",
    allowedFormats: ["png", "jpg", "jpeg"],
  },
});

module.exports = {
  cloudinary,
  storage,
};
```
- Configures Cloudinary for image storage
- Sets upload folder and allowed formats
- Exports storage for Multer

### config/nodemail.js

**Lines 1-16:** Nodemailer Configuration
```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;
```
- Configures Gmail SMTP
- Uses app password from environment variables
- Exports transporter for use in controllers

---

## Utilities

### utils/ExpressError.js

**Lines 1-8:** Custom Error Class
```javascript
class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}
module.exports = ExpressError;
```
- Custom error class with status code
- Used for consistent error handling

### utils/sendPdf.js

**Lines 1-60:** PDF Ticket Generator
```javascript
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const transporter = require("../config/nodemail.js");

const sendTicketPdf = async (booking, user) => {
  let browser = null;
  try {
    // Render EJS template to HTML
    const templatePath = path.join(
      __dirname,
      "../views/listings/bookingConfirm.ejs"
    );
    const html = await ejs.renderFile(templatePath, { booking });

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // Send email with PDF attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Booking Confirmed! - ${booking.listing.title}`,
      html: `...`,
      attachments: [
        {
          filename: `Wanderlust_Ticket_${booking._id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ticket PDF sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending PDF email:", error);
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { sendTicketPdf };
```
- Renders EJS template to HTML
- Uses Puppeteer to convert HTML to PDF
- Sends PDF as email attachment
- Always closes browser to free resources

### schema.js

**Lines 1-35:** Listing Schema Validation
```javascript
module.exports.listingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  country: Joi.string().required(),
  price: Joi.number().required().min(0),
  image: Joi.string().allow("", null),
  geometry: Joi.object({
    type: Joi.string().valid("Point"),
    coordinates: Joi.array().items(Joi.number()).required().length(2),
  }),
  category: Joi.array()
    .items(
      Joi.string().valid(
        "Trending", "Rooms", "Mountains", "Iconic Cities",
        "Castles", "Pools", "Camping", "Farms",
        "Arctic", "Boats", "Domes", "Beaches",
        "Luxury", "Wildlife", "Adventure"
      )
    )
    .required(),
});
```
- Validates listing data structure
- Ensures required fields present
- Validates category enum values
- Validates geometry coordinates

**Lines 37-42:** Review Schema
```javascript
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().min(20).max(1000),
  }).required(),
});
```
- Validates rating (1-5)
- Validates comment length (20-1000 characters)

**Lines 44-70:** User Schema
```javascript
module.exports.userSchema = Joi.object({
  email: Joi.string().pattern(/.+@.+/).required(),
  password: Joi.string()
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$")
    )
    .required(),
  username: Joi.string().required(),
  age: Joi.number().min(1).max(120).allow(null, ""),
  gender: Joi.string().valid("Male", "Female", "Other").allow(null, ""),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow(null, ""),
  preferences: Joi.array().items(Joi.string()),
  profilePicture: Joi.string().allow(null, ""),
});
```
- Validates email format
- Validates password strength (uppercase, lowercase, number, special char, min 8 chars)
- Validates phone number (exactly 10 digits)
- Validates age range (1-120)

**Lines 72-78:** Search Schema
```javascript
module.exports.searchSchema = Joi.object({
  q: Joi.string()
    .trim()
    .max(100)
    .allow(""),
}).unknown(true);
```
- Validates search query
- Max length 100 characters
- Allows empty string

---

## Frontend Structure

### views/layouts/boilerplate.ejs

This is the main layout template that wraps all pages:

**Lines 1-6:** HTML Head
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WanderLusT</title>
```
- Sets up basic HTML structure
- Responsive viewport meta tag

**Lines 7-54:** External Dependencies
- Bootstrap CSS/JS for styling
- Select2 for dropdowns
- Font Awesome for icons
- Leaflet for maps
- Google Fonts
- Custom CSS files
- jQuery and other JS libraries

**Lines 56-62:** Body Structure
```html
<body>
  <%- include("../includes/navbar.ejs") %>
  <div class="container">
    <%- include("../includes/flash.ejs") %> 
    <%- body %>
  </div>
  <%- include("../includes/footer.ejs") %>
```
- Includes navbar, flash messages, page content, and footer
- Uses EJS include syntax
- `<%- body %>` is where page-specific content is inserted

**Lines 63-86:** Scripts
- Bootstrap JS
- Leaflet JS
- Custom JavaScript files for various features

---

## Key Features Summary

1. **Authentication & Authorization:**
   - Passport.js with local strategy
   - Email verification required for bookings
   - Session management with MongoDB store
   - Password reset functionality

2. **Listing Management:**
   - CRUD operations for listings
   - Image upload to Cloudinary
   - Geocoding for map display
   - Category and country filtering
   - Preference-based sorting for logged-in users

3. **Booking System:**
   - Date validation (check-in before check-out)
   - Maximum 30-day booking limit
   - Razorpay payment integration
   - PDF ticket generation and email
   - Email notifications to listing owners

4. **Reviews & Ratings:**
   - 1-5 star rating system
   - Comment validation (20-1000 characters)
   - Users can't review their own listings
   - Review deletion by author

5. **User Profile:**
   - Profile picture upload/removal
   - Preference management
   - Email change (with restrictions)
   - Account deletion with cascade

6. **Search & Filter:**
   - Fuzzy search using Fuse.js
   - Category filtering
   - Country filtering
   - Price sorting

7. **Security:**
   - Password hashing (bcrypt via passport-local-mongoose)
   - Session encryption
   - CSRF protection via httpOnly cookies
   - Input validation (Joi)
   - File size limits
   - Payment signature verification

---

## Environment Variables Required

```env
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=cloudinary_secret
OPENCAGE_MAP_TOKEN=opencage_geocoder_token
ATLAS_DB_URL=mongodb_atlas_url
SECRET=your_session_secret
EMAIL_PASS=your_email_app_password
EMAIL_USER=email_to_send_emails
RAZORPAY_KEY_ID=payment_gateway_keyId
RAZORPAY_KEY_SECRET=payment_gateway_secret
```

---

## Database Relationships

1. **User → Listings:** One-to-Many (User can have multiple listings)
2. **User → Reviews:** One-to-Many (User can write multiple reviews)
3. **User → Bookings:** One-to-Many (User can make multiple bookings)
4. **Listing → Reviews:** One-to-Many (Listing can have multiple reviews)
5. **Listing → Bookings:** One-to-Many (Listing can have multiple bookings)

---

## Flow Examples

### User Registration Flow:
1. User submits signup form
2. Server validates data (Joi)
3. Check email uniqueness
4. Register user (hash password)
5. Generate verification token
6. Send verification email
7. User clicks link → verify email → auto-login

### Booking Flow:
1. User selects listing
2. Fill booking form (dates, guests)
3. Validate dates (check-in < check-out, max 30 days)
4. Calculate total price
5. Create Razorpay order
6. User pays via Razorpay
7. Verify payment signature
8. Create booking record
9. Generate PDF ticket
10. Send email to user and listing owner
11. Show confirmation page

### Listing Creation Flow:
1. User fills listing form
2. Upload image (Multer → Cloudinary)
3. Validate data (Joi)
4. Geocode location (OpenCage API)
5. Create listing with coordinates
6. Save to database
7. Redirect to listings page

---

This completes the comprehensive line-by-line explanation of the Wanderlust project. Every important file, function, and feature has been documented with detailed explanations of their purpose and implementation.


