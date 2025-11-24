const User = require("../models/user.js");
const crypto = require("crypto");
const transporter = require("../config/nodemail.js");
const bcrypt = require("bcrypt");

// ===============================SIGN UP=================================
module.exports.renderSignUp = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, password, email } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash("error", "User with this Email already Exists .");
      return res.redirect("/signup");
    }

    // Create the new user instance
    const newUser = new User({ email, username });

    // 1. Register the user (Passport-local-mongoose hashes password)
    // The 'isVerified' field is 'false' by default from your schema
    const registeredUser = await User.register(newUser, password);

    // 2. Generate the verification token
    const token = crypto.randomBytes(20).toString("hex");
    registeredUser.emailVerificationToken = token;
    registeredUser.emailVerificationExpires = Date.now() + 3600000; // 1 hour

    await registeredUser.save();

    const verificationLink = `http://${req.headers.host}/verify-email?token=${token}`;

    await transporter.sendMail({
      to: registeredUser.email,
      from: ` <${process.env.EMAIL_USER}>`, // Must be your authenticated email
      subject: "Verify Your Email for Wanderlust",
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for signing up! Please click the link below to verify your email address:</p>
        <a href="${verificationLink}" style="padding: 10px 15px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <br>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });

    req.flash("success", "click on the link sent to your email");

    res.render("partials/renderEmail.ejs", { process: "verify" }); // Send them to the login page
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

// =======================================LOGIN=====================================
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome  ${req.body.username} `);
  // let redirectUrl = res.locals.redirectUrl || "/listings";
  let redirectUrl = "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out");
    res.redirect("/listings");
  });
};

module.exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;

    // 1. Find user with this token and check if it's expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }, // $gt = greater than
    });

    if (!user) {
      req.flash("error", "Verification token is invalid or has expired.");
      return res.redirect("/login");
    }

    // 2. If token is valid, verify the user
    user.isVerified = true;
    user.emailVerificationToken = undefined; // Clear the token
    user.emailVerificationExpires = undefined; // Clear the expiry

    await user.save();

    req.flash("success", "Email verified successfully! You can now log in.");
    // res.redirect("/listings");
    req.login(user, (err) => {
      if (err) {
        return next(err); // Pass errors to Express error handler
      }
      // Now a session is established, and req.isAuthenticated() will be true.
      req.flash("success", "Email Verification Successfull.");
      res.redirect("/listings"); // Or wherever you want them to go
    });
  } catch (e) {
    req.flash("error", "Something went wrong.");
    res.redirect("/login");
  }
};

module.exports.renderEmailPage = (req, res) => {
  res.render("partials/renderEmail.ejs");
};

// ========================REVERIFY EMAIL=======================================
module.exports.renderReVerifyEmailPage = (req, res) => {
  res.render("users/verifyEmail.ejs", { email: req.user.email });
};
module.exports.resendEmail = async (req, res, next) => {
  try {
    const { email: newEmail } = req.body;

    // 1. Get the current logged-in user object from the database
    const user = await User.findById(req.user._id);

    if (!user) {
      req.flash("error", "User session expired or not found.");
      return res.redirect("/login");
    }

    // 2. CASE: User submitted a DIFFERENT email address
    if (newEmail && newEmail !== user.email) {
      // Added null/empty check

      // --- CRITICAL CORRECTION: Check if the new email belongs to another user ---
      const existingUser = await User.findOne({ email: newEmail });

      if (existingUser && !existingUser._id.equals(user._id)) {
        // The new email is owned by someone else who is NOT the current user
        req.flash("error", "A user with this new email already exists.");
        // Use resend-verification-link for better UX (stays on the same form)
        return res.redirect("/resend-verification-link");
      }
      // --- END CORRECTION ---

      // Apply changes if valid and unique
      user.email = newEmail;
      user.isEmailVerified = false; // Mark new email as unverified
    }
    // NOTE: If newEmail === user.email, the code proceeds to Step 3 using the existing user.email.

    // 3. Generate new token and expiry
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour expiry

    await user.save();

    const verificationLink = `http://${req.headers.host}/verify-email?token=${verificationToken}`;

    // await sendVerificationEmail(user.email, verificationLink);
    await transporter.sendMail({
      to: user.email,
      from: ` <${process.env.EMAIL_USER}>`, // Must be your authenticated email
      subject: "Verify Your Email for Wanderlust",
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for signing up! Please click the link below to verify your email address:</p>
        <a href="${verificationLink}" style="padding: 10px 15px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <br>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });

    req.flash(
      "success",
      `Verification link sent to ${user.email}. Please check your inbox.`
    );
    res.render("partials/renderEmail.ejs", { process: "reverify" });
  } catch (e) {
    console.error("Error in resend-verification:", e);
    // Pass error to the Express error handler middleware
    next(e);
  }
};

// ===============================FORGOT PASSWORD===============================
module.exports.renderForgotPasswordPage = (req, res) => {
  res.render("users/forgotPassword.ejs");
};

//post submit form of forgot password
module.exports.submitForgotPassForm = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find User by email
    const user = await User.findOne({ email });

    // SECURITY: Generic response to prevent user enumeration.
    if (!user) {
      req.flash("error", "This mail is not registered");
      return res.redirect("/signup");
    }

    // 2. Generate Token & Set Expiration (e.g., 1 hour from now)
    // Note: MongoDB handles UTC time very well when using the Date type.
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = Date.now() + 3600000; // 1 hour in milliseconds

    // 3. Save to DB using Mongoose
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(tokenExpiration);
    await user.save(); // Saves the changes to the MongoDB document

    // 4. Send Email (Backend URL will be the actual server)
    const resetURL = `http://localhost:3333/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      from: ` <${process.env.EMAIL_USER}>`, // Must be your authenticated email
      subject: "Password Reset Request",
      html: `
        
        <a href="${resetURL}" style="padding: 10px 15px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">
         Reset Password
        </a>
        <br>
        <p>If you not did this, please ignore this email.</p>
      `,
    });

    res.render("partials/renderEmail.ejs", { process: "reset" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports.renderResetForgotForm = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      req.flash("error", "Missing password reset token.");
      return res.redirect("/forgot-password");
    }

    // Find user by token AND check if the token is still valid (not expired)
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }, // $gt: greater than current time
    });

    if (!user) {
      req.flash(
        "error",
        "Password reset link is invalid or has expired. Please request a new one."
      );
      return res.redirect("/forgot-password");
    }

    // If validation passes, RENDER the form
    // Pass the token to the template so it can be included as a hidden field in the POST submission
    res.render("users/resetPassword.ejs", { token: token });
  } catch (error) {
    console.error("GET Reset Password Error:", error);
    res.render("error", { message: "An unexpected error occurred." });
  }
};

//------------changing password by using bycrypt------------------//

// module.exports.resetPassword = async (req, res) => {

//     const { token, newPassword } = req.body;
//     const user = await User.findOne({
//       resetToken: token,
//     });
//     const saltRounds = 10;
//     const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

//     // 4. Update Database (using Mongoose save() method)
//     user.hash = newPasswordHash;
//     user.resetToken = null; // Clear the token
//     user.resetTokenExpires = null; // Clear the expiration

// };

//--------------------------------------------------------------------//

module.exports.resetPassword = async (req, res) => {
  try {
    // 1. De-structure form data
    const { token, password, confirmPassword } = req.body;

    // 2. Validate Password Match
    if (password !== confirmPassword) {
      req.flash("error", "confirm password is not same as new password");
      res.redirect("/forgot-password");
    }

    // 3. Find User by Token and check if it's NOT expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset link is invalid or has expired.");
      res.redirect("/forgot-password");
    }

    // --- CRITICAL CHANGE FOR passport-local-mongoose ---

    // 5. Use the setPassword() method:
    // This method automatically hashes the new password and saves the new hash/salt to the user document.
    await user.setPassword(password);

    // 6. Clear Token Fields (These were manually added and still need manual clearing)
    user.resetToken = null;
    user.resetTokenExpires = null;

    // The save() call here is to save the changes to the resetToken fields,
    // although setPassword() often calls save() internally. It's safer to call it
    // again here to ensure the token fields are cleared.
    await user.save();
    req.flash("success", "password change successfully!");
    res.redirect("/login");
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
};
