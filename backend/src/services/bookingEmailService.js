import { mailTransporter } from '../config/mailer.js';
import { appConfig } from '../config/env.js';

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return isNaN(date?.getTime?.()) ? null : date;
};

const fmtMoney = (value) => {
  if (value == null || value === '') return 'N/A';
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
      Number(value),
    );
  } catch (_err) {
    return String(value);
  }
};

const safeValue = (value) => (value == null || value === '' ? 'N/A' : value);

const normalizeRooms = (bookingData, body, fallbackNights) => {
  if (Array.isArray(bookingData?.rooms)) return bookingData.rooms;
  if (Array.isArray(body?.rooms)) return body.rooms;

  const fallbackRoom = bookingData?.room || body?.room;
  if (fallbackRoom && typeof fallbackRoom === 'object') return [fallbackRoom];

  if (
    body?.roomName ||
    body?.roomType ||
    body?.roomCount ||
    body?.pricePerNight
  ) {
    const quantity = Number(body?.roomCount ?? 1) || 1;
    const pricePerNight = Number(body?.pricePerNight ?? 0) || 0;
    const nights = Number(bookingData?.nights ?? body?.nights ?? fallbackNights ?? 1) || 1;
    const name = body?.roomName ?? body?.roomType;
    return [{ name, quantity, pricePerNight, nights }];
  }

  return [];
};

const buildRoomSection = (bookingData, body) => {
  const checkIn = bookingData?.checkIn ?? body?.checkIn;
  const checkOut = bookingData?.checkOut ?? body?.checkOut;
  const nights = (() => {
    const ci = toDate(checkIn);
    const co = toDate(checkOut);
    if (!ci || !co) return null;
    return Math.max(1, Math.round((co - ci) / (1000 * 60 * 60 * 24)));
  })();

  const rooms = normalizeRooms(bookingData, body, nights);

  if (!rooms.length) {
    return {
      html: '<p><i>No room details provided</i></p>',
      computedTotal: null,
    };
  }

  const normalizedRooms = rooms.map((room) => {
    const quantity = Number(room?.quantity ?? room?.roomCount ?? 1) || 1;
    const pricePerNight = Number(room?.pricePerNight ?? room?.price ?? 0) || 0;
    const itemNights = Number(room?.nights ?? nights ?? 1) || 1;
    const name = room?.name ?? room?.roomName ?? room?.type ?? room?.roomType;
    return { name, quantity, pricePerNight, nights: itemNights };
  });

  let rows = '';
  let sum = 0;
  normalizedRooms.forEach((room) => {
    const lineTotal = room.pricePerNight * room.quantity * room.nights;
    sum += Number.isFinite(lineTotal) ? lineTotal : 0;
    rows += `
      <tr>
        <td>${safeValue(room.name)}</td>
        <td style="text-align:center">${room.quantity}</td>
        <td style="text-align:right">${fmtMoney(room.pricePerNight)}</td>
        <td style="text-align:center">${room.nights}</td>
        <td style="text-align:right">${fmtMoney(lineTotal)}</td>
      </tr>`;
  });

  return {
    computedTotal: sum,
    html: `
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
      </table>`,
  };
};

const resolveHotelEmail = (bookingData, body) =>
  bookingData.hotelEmail ??
  bookingData.hotelMail ??
  body?.hotelEmail ??
  body?.hotelMail ??
  appConfig.hotelEmail;

const buildMailBody = (body) => {
  const userInfo = body?.user || {};
  const bookingData = body?.booking_data || {};

  const fullName = userInfo.fullName ?? body?.fullName;
  const email = userInfo.email ?? body?.email;
  const phone = userInfo.phone ?? body?.phone;
  const country = userInfo.country ?? body?.country;
  const message = userInfo.message ?? body?.message;

  const checkIn = bookingData.checkIn ?? body?.checkIn;
  const checkOut = bookingData.checkOut ?? body?.checkOut;
  const adultCount = bookingData.adultCount ?? body?.adultCount;
  const childCount = bookingData.childCount ?? body?.childCount;

  const bookingIntro = `
    <h2>New Hotel Booking Request</h2>
    <p><b>Customer Name:</b> ${fullName}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Phone:</b> ${phone}</p>
    <p><b>Country:</b> ${country}</p>
    <p><b>Message:</b> ${message || 'No message provided'}</p>
    <hr>
    <h3>Booking Details</h3>
    <p><b>Check-in:</b> ${checkIn}</p>
    <p><b>Check-out:</b> ${checkOut}</p>
    <p><b>Adults:</b> ${adultCount}</p>
    <p><b>Children:</b> ${childCount}</p>
    <br>
    <p>— This message was sent automatically from your hotel booking system.</p>
  `;

  const roomSection = buildRoomSection(bookingData, body);
  const totalAmount =
    bookingData.totalPrice ?? body?.totalPrice ?? roomSection.computedTotal;

  return {
    hotelEmail: resolveHotelEmail(bookingData, body),
    customerEmail: email,
    fullName,
    html: `${bookingIntro}
      <hr>
      <h3>Room Details</h3>
      ${roomSection.html}
      ${totalAmount != null ? `<p><b>Total Amount:</b> ${fmtMoney(totalAmount)}</p>` : ''}`,
  };
};

export const sendBookingEmail = async (body) => {
  const { hotelEmail, customerEmail, fullName, html } = buildMailBody(body);

  if (!hotelEmail) {
    throw new Error('Missing hotel email address');
  }

  const mailOptions = {
    from: `"Hotel Booking System" <${appConfig.emailUser}>`,
    to: hotelEmail,
    replyTo: customerEmail || undefined,
    subject: ` New Booking from ${fullName}`,
    html,
  };

  await mailTransporter.sendMail(mailOptions);
  return { recipient: hotelEmail };
};
