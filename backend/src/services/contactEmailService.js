import { mailTransporter } from '../config/mailer.js';
import { appConfig } from '../config/env.js';

const extractContactData = (body) => {
  const userInfo = body?.user || {};

  const fullName = userInfo.fullName ?? body?.fullName;
  const email = userInfo.email ?? body?.email;
  const phone = userInfo.phone ?? body?.phone;
  const country = userInfo.country ?? body?.country;
  const message = userInfo.message ?? body?.message;
  const hotelEmail = body?.hotelEmail ?? appConfig.hotelEmail;

  if (!hotelEmail) {
    throw new Error('Missing destination hotel email address');
  }

  return {
    hotelEmail,
    fullName,
    email,
    phone,
    country,
    message,
  };
};

const buildContactHtml = ({ fullName, email, phone, country, message }) => `
  <h2>New Contact Message</h2>
  <p><b>Name:</b> ${fullName || 'N/A'}</p>
  <p><b>Email:</b> ${email || 'N/A'}</p>
  <p><b>Phone:</b> ${phone || 'N/A'}</p>
  <p><b>Country:</b> ${country || 'N/A'}</p>
  <hr>
  <p><b>Message:</b></p>
  <p>${message || 'No message provided'}</p>
  <br>
  <p>— Sent automatically from your website contact form.</p>
`;

export const sendContactEmail = async (body) => {
  const contactData = extractContactData(body);
  const html = buildContactHtml(contactData);

  const mailOptions = {
    from: `"Hotel Booking System" <${appConfig.emailUser}>`,
    to: contactData.hotelEmail,
    replyTo: contactData.email || undefined,
    subject: `New Contact Request from ${contactData.fullName || 'guest'}`,
    html,
  };

  await mailTransporter.sendMail(mailOptions);

  return { recipient: contactData.hotelEmail };
};
