import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: process.env.PORT || 3000,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  hotelEmail: process.env.HOTEL_EMAIL || process.env.EMAIL_USER,
};
