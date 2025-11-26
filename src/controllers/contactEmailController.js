import { sendContactEmail } from '../services/contactEmailService.js';

export const contactEmailController = async (req, res, next) => {
  try {
    const result = await sendContactEmail(req.body);
    res.json({ message: 'Contact email sent to hotel successfully!', ...result });
  } catch (error) {
    next(error);
  }
};
