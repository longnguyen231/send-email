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

    // Accept alternate field name `hotelMail`
    const hotelEmailFinal = hotelEmail || req.body.hotelMail;

    if (!hotelEmailFinal) {
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
    // Build additional Room Details section
    const toDate = (v) => {
      const d = v ? new Date(v) : null;
      return isNaN(d?.getTime?.()) ? null : d;
    };
    const ci = toDate(checkIn);
    const co = toDate(checkOut);
    const nights = ci && co ? Math.max(1, Math.round((co - ci) / (1000 * 60 * 60 * 24))) : null;

    const fmtMoney = (n, cur) => {
      if (n == null || n === "") return "N/A";
      try {
        return new Intl.NumberFormat(undefined, { style: cur ? "currency" : undefined, currency: cur || undefined, maximumFractionDigits: 2 }).format(Number(n));
      } catch (_) {
        return `${n}${cur ? " " + cur : ""}`;
      }
    };
    const safe = (v) => (v == null || v === "" ? "N/A" : v);
    const currency = req.body.currency;

    let roomDetailsHtml = "<p><i>No room details provided</i></p>";
    let computedTotal = null;

    if (Array.isArray(req.body.rooms) && req.body.rooms.length) {
      let rows = "";
      let sum = 0;
      req.body.rooms.forEach((r) => {
        const qty = Number(r?.quantity ?? r?.roomCount ?? 1) || 1;
        const ppn = Number(r?.pricePerNight ?? r?.price ?? 0) || 0;
        const itemNights = Number(r?.nights ?? nights ?? 1) || 1;
        const line = ppn * qty * itemNights;
        sum += Number.isFinite(line) ? line : 0;
        rows += `
          <tr>
            <td>${safe(r?.name ?? r?.roomName ?? r?.type ?? r?.roomType)}</td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:right">${fmtMoney(ppn, r?.currency || currency)}</td>
            <td style="text-align:center">${itemNights}</td>
            <td style="text-align:right">${fmtMoney(line, r?.currency || currency)}</td>
          </tr>`;
      });
      computedTotal = sum;
      roomDetailsHtml = `
        <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd;width:100%">
          <thead>
            <tr style="background:#f7f7f7">
              <th align="left">Room</th>
              <th>Qty</th>
              <th align="right">Price/Night</th>
              <th>Nights</th>
              <th align="right">Line Total</th>
            </tr>
          </thead>
          <tbody>${rows}
          </tbody>
        </table>`;
    } else if (req.body.room && typeof req.body.room === "object") {
      const r = req.body.room;
      const qty = Number(r?.quantity ?? r?.roomCount ?? 1) || 1;
      const ppn = Number(r?.pricePerNight ?? r?.price ?? req.body.pricePerNight ?? 0) || 0;
      const itemNights = Number(r?.nights ?? nights ?? 1) || 1;
      const line = ppn * qty * itemNights;
      computedTotal = Number.isFinite(line) ? line : null;
      roomDetailsHtml = `
        <p><b>Room:</b> ${safe(r?.name ?? r?.roomName ?? r?.type ?? r?.roomType)}</p>
        <p><b>Quantity:</b> ${qty}</p>
        <p><b>Price/Night:</b> ${fmtMoney(ppn, r?.currency || currency)}</p>
        <p><b>Nights:</b> ${itemNights}</p>`;
    } else if (req.body.roomName || req.body.roomType || req.body.roomCount || req.body.pricePerNight || req.body.totalPrice) {
      const qty = Number(req.body.roomCount ?? 1) || 1;
      const ppn = Number(req.body.pricePerNight ?? 0) || 0;
      const itemNights = Number(nights ?? 1) || 1;
      const line = ppn * qty * itemNights;
      computedTotal = Number.isFinite(line) ? line : null;
      roomDetailsHtml = `
        <p><b>Room:</b> ${safe(req.body.roomName ?? req.body.roomType)}</p>
        <p><b>Quantity:</b> ${qty}</p>
        <p><b>Price/Night:</b> ${fmtMoney(ppn, currency)}</p>
        <p><b>Nights:</b> ${itemNights}</p>`;
    }

    const overallTotal = (req.body.totalPrice != null ? req.body.totalPrice : computedTotal);
    const roomSection = `
      <hr>
      <h3>Room Details</h3>
      ${roomDetailsHtml}
      ${overallTotal != null ? `<p><b>Total Amount:</b> ${fmtMoney(overallTotal, currency)}</p>` : ""}
    `;

    const finalContent = mailContent + roomSection;

    const mailOptions = {
      from: `"Hotel Booking System" <${process.env.EMAIL_USER}>`,
      to: hotelEmailFinal,
      subject: ` New Booking from ${fullName}`,
      html: finalContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: " Booking email sent successfully to hotel owner!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: " Failed to send booking email", error });
  }
});

export default router;
