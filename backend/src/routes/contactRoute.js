import { Router } from 'express';
import { contactEmailController } from '../controllers/contactEmailController.js';

const router = Router();
router.post('/', contactEmailController);

export default router;
