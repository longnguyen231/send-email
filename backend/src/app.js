import express from 'express';
import cors from 'cors';
import bookingEmailRoute from './routes/bookingEmailRoute.js';
import contactRoute from './routes/contactRoute.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingEmailRoute);
app.use('/api/contact', contactRoute);

app.use((err, _req, res, _next) => {
  console.error('Error sending email:', err);
  res.status(500).json({ message: 'Failed to send email', error: err.message });
});

export default app;
