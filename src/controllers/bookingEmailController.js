import { sendBookingEmail } from '../services/bookingEmailService.js';

export const bookingEmailController = async (req, res, next) => {
  try {
    const result = await sendBookingEmail(req.body);
    res.json({ message: 'Booking email sent successfully to hotel owner!', ...result });
  } catch (error) {
    next(error);
  }
};
