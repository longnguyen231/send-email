import { Router } from 'express';
import { bookingEmailController } from '../controllers/bookingEmailController.js';

const router = Router();
router.post('/send-email', bookingEmailController);

export default router;
