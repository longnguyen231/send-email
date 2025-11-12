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
    const userInfo = req.body.user || {};
    const bookingData = req.body.booking_data || {};

    const fullName = userInfo.fullName ?? req.body.fullName;
    const email = userInfo.email ?? req.body.email;
    const phone = userInfo.phone ?? req.body.phone;
    const country = userInfo.country ?? req.body.country;
    const message = userInfo.message ?? req.body.message;

    const checkIn = bookingData.checkIn ?? req.body.checkIn;
    const checkOut = bookingData.checkOut ?? req.body.checkOut;
    const adultCount = bookingData.adultCount ?? req.body.adultCount;
    const childCount = bookingData.childCount ?? req.body.childCount;

    const hotelEmailFinal = (bookingData.hotelEmail || req.body.hotelEmail || req.body.hotelMail || bookingData.hotelMail);

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

    const fmtMoney = (n) => {
      if (n == null || n === "") return "N/A";
      try {
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(n));
      } catch (_) {
        return String(n);
      }
    };
    const safe = (v) => (v == null || v === "" ? "N/A" : v);
    // Currency field is intentionally ignored/omitted

    let roomDetailsHtml = "<p><i>No room details provided</i></p>";
    let computedTotal = null;

    // Normalize to a single rooms array for simplicity
    const roomsArray = (() => {
      if (Array.isArray(bookingData.rooms)) return bookingData.rooms;
      if (Array.isArray(req.body.rooms)) return req.body.rooms;
      const fallbackRoom = bookingData.room || req.body.room;
      if (fallbackRoom && typeof fallbackRoom === "object") return [fallbackRoom];
      if (req.body.roomName || req.body.roomType || req.body.roomCount || req.body.pricePerNight) {
        const qty = Number(req.body.roomCount ?? 1) || 1;
        const ppn = Number(req.body.pricePerNight ?? 0) || 0;
        const itemNights = Number(bookingData.nights ?? req.body.nights ?? nights ?? 1) || 1;
        const name = (req.body.roomName ?? req.body.roomType);
        return [{ name, quantity: qty, pricePerNight: ppn, nights: itemNights }];
      }
      return [];
    })();

    if (roomsArray.length) {
      const normalizedRooms = roomsArray.map((r) => {
        const quantity = Number(r?.quantity ?? r?.roomCount ?? 1) || 1;
        const pricePerNight = Number(r?.pricePerNight ?? r?.price ?? 0) || 0;
        const itemNights = Number(r?.nights ?? nights ?? 1) || 1;
        const name = r?.name ?? r?.roomName ?? r?.type ?? r?.roomType;
        return { name, quantity, pricePerNight, nights: itemNights };
      });

      let rows = "";
      let sum = 0;
      normalizedRooms.forEach((r) => {
        const line = r.pricePerNight * r.quantity * r.nights;
        sum += Number.isFinite(line) ? line : 0;
        rows += `
          <tr>
            <td>${safe(r.name)}</td>
            <td style="text-align:center">${r.quantity}</td>
            <td style="text-align:right">${fmtMoney(r.pricePerNight)}</td>
            <td style="text-align:center">${r.nights}</td> 
            <td style="text-align:right">${fmtMoney(line)}</td>
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
    }

    const overallTotal = (
      bookingData.totalPrice != null
        ? bookingData.totalPrice
        : (req.body.totalPrice != null ? req.body.totalPrice : computedTotal)
    );
    const roomSection = `
      <hr>
      <h3>Room Details</h3>
      ${roomDetailsHtml}
      ${overallTotal != null ? `<p><b>Total Amount:</b> ${fmtMoney(overallTotal)}</p>` : ""}
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
