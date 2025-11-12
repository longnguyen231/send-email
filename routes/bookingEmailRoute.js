import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Cấu hình SMTP (dùng Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


router.post("/send-email", async (req, res) => {
  try {
    const {
      hotelEmail, 
      fullName,
      email,
      phone,
      country,
      message,
      checkIn,
      checkOut,
      adultCount,
      childCount,
    } = req.body;

    if (!hotelEmail) {
      return res.status(400).json({ message: "Missing hotel email" });
    }

   
    const mailContent = `
      <h2>New Hotel Booking Request</h2>
      <p><b>Customer Name:</b> ${fullName}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Country:</b> ${country}</p>
      <p><b>Message:</b> ${message || "No message provided"}</p>
      <hr>
      <h3>Booking Details</h3>
      <p><b>Check-in:</b> ${checkIn}</p>
      <p><b>Check-out:</b> ${checkOut}</p>
      <p><b>Adults:</b> ${adultCount}</p>
      <p><b>Children:</b> ${childCount}</p>
      <br>
      <p>— This message was sent automatically from your hotel booking system.</p>
    `;

    // Cấu hình email
    const mailOptions = {
      from: `"Hotel Booking System" <${process.env.EMAIL_USER}>`,
      to: hotelEmail,
      subject: ` New Booking from ${fullName}`,
      html: mailContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: " Booking email sent successfully to hotel owner!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: " Failed to send booking email", error });
  }
});

export default router;
