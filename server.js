import express from 'express';
import dotenv from 'dotenv';
import bookingEmailRoute from './routes/bookingEmailRoute.js';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS for all origin
app.use(cors());

// Đăng ký route
app.use('/api/bookings', bookingEmailRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
