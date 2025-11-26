import nodemailer from 'nodemailer';
import { appConfig } from './env.js';

if (!appConfig.emailUser || !appConfig.emailPass) {
  console.warn('⚠️  EMAIL_USER or EMAIL_PASS is not defined in environment variables.');
}

export const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: appConfig.emailUser,
    pass: appConfig.emailPass,
  },
});
