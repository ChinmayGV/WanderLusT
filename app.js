if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

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

const mongourl = process.env.ATLAS_DB_URL;
// const mongourl = process.env.LOCAL_DB_URL; //uncomment this to use local DB
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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store = MongoStore.create({
  mongoUrl: mongourl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,
});

store.on("error", () => {
  console.log("ERROR in mongo session store");
});

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

app.use((req, res, next) => {
  res.locals.currentPath = req.path; // This is the "route" you want to check
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings");
  // return res.render("/listings/demo.ejs");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // this don't tells specific name or password incorrect
// passport.use(
//   new LocalStrategy(async (username, password, done) => {
//     const user = await User.findOne({ username });

//     if (!user) {
//       return done(null, false, { message: "Incorrect username" });
//     }

//     const isValid = await user.verifyPassword(password);

//     if (!isValid) {
//       return done(null, false, { message: "Incorrect password" });
//     }

//     return done(null, user);
//   })
// );

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

const Listing = require("./models/listing");

//----------------------for navbar
// Check if logged-in user owns any listings
app.use(async (req, res, next) => {
  try {
    if (req.user) {
      const userListings = await Listing.find({ owner: req.user._id });

      res.locals.hasListings = userListings.length > 0; // true or false
      // listing data if needed
    } else {
      res.locals.hasListings = false; // user not logged in
    }
    next();
  } catch (err) {
    next(err);
  }
});
//------------------for navbar--------------------//
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "student@33gmail.com",
    username: "deepansh",
  });

  let registeredUser = await User.register(fakeUser, "helloworld");
  //this register method auto check if a user with same username exit in DB or not
  //if exits it gives error
  res.send(registeredUser);
});
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/terms", termsRouter);
app.use("/", optionRouter);
app.use("/listings/:id", bookingRouter);

app.all(/.*/, (req, res) => {
  throw new ExpressError(404, "Page Not Found");
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  // res.status(statusCode).send(message);
  res.render("error.ejs", { err, statusCode, message });
});

app.listen(port, () => {
  console.log(`Server is Listening to the Port:${port}`);
});
