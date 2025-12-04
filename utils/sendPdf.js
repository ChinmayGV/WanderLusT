const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const transporter = require("../config/nodemail.js"); // <--- Import your existing transporter

const sendTicketPdf = async (booking, user) => {
  let browser = null;
  try {
    // 1. Define path to template
    const templatePath = path.join(
      __dirname,
      "../views/listings/bookingConfirm.ejs"
    );

    // 2. Render EJS to HTML string
    const html = await ejs.renderFile(templatePath, { booking });

    // 3. Launch Puppeteer to create PDF
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // 4. Send Email using your EXISTING transporter
    const mailOptions = {
      from: process.env.EMAIL_USER, // Use the env var directly
      to: user.email,
      subject: `Booking Confirmed! - ${booking.listing.title}`,
      html: `
        <h3>Hi ${user.username},</h3>
        <p>Your booking for <b>${booking.listing.title}</b> is confirmed!</p>
        <p>Please find your official ticket attached to this email.</p>
        <br>
        <p>Regards,<br>Team Wanderlust</p>
      `,
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
    // Always close browser to free up RAM, even if error occurs
    if (browser) await browser.close();
  }
};

module.exports = { sendTicketPdf };
