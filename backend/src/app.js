import express from 'express';
import cors from 'cors';
import bookingEmailRoute from './routes/bookingEmailRoute.js';
import contactRoute from './routes/contactRoute.js';
import rateLimit from 'express-rate-limit';
const app = express();

app.use(cors());
app.use(express.json());

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 5,              // tối đa 5 email / phút / IP
  message: "Too many booking emails sent. Please try again later."
});

// Limit cho contact form
const contactLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many contact requests. Please slow down."
});


app.use('/api/bookings', bookingLimiter, bookingEmailRoute);
app.use('/api/contact', contactLimiter, contactRoute);

app.use((err, _req, res, _next) => {
  console.error('Error sending email:', err);
  res.status(500).json({ message: 'Failed to send email', error: err.message });
});

export default app;
