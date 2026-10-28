import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'kolwa_embroidery_fallback_secret_key_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  initialAdminUsername: process.env.INITIAL_ADMIN_USERNAME || 'Kolwa',
  initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD || '1234',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata'
};
