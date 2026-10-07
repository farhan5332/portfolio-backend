import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Fail fast if a required variable is missing, instead of crashing later with a vague error.
const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
  console.error('   Check your .env file (see .env.example).');
  process.exit(1);
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error('❌ JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.');
  process.exit(1);
}

for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (process.env[key].length < 32) {
    console.warn(`⚠️  ${key} is short. Generate a long random one (see README).`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI,
  clientUrls: (process.env.CLIENT_URLS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7,
  },
  // 'local' = uploads/ folder, 'database' = MongoDB GridFS (for hosts that wipe the disk)
  uploadStorage: process.env.UPLOAD_STORAGE === 'database' ? 'database' : 'local',
  // 'none' is only needed when the admin panel is hosted on a different domain than the API.
  cookieSameSite: process.env.COOKIE_SAMESITE === 'none' ? 'none' : 'lax',
  // Optional: without these, contact messages are still saved but no email is sent.
  smtp: {
    enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO || process.env.SMTP_USER,
  },
};

if (!env.smtp.enabled) {
  console.warn('⚠️  SMTP is not configured: contact messages will be saved but not emailed.');
}
