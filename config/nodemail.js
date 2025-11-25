// config/nodemailer.js

const nodemailer = require("nodemailer");

// Create the transporter object
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // Your email from .env
    pass: process.env.EMAIL_PASS, // Your App Password from .env
  },
});

module.exports = transporter;
