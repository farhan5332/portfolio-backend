// Creates the first admin user (or resets its password).
//   npm run create-admin   -> create the admin from ADMIN_* values in .env
//   npm run reset-admin    -> set a new password for an existing admin
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

const { ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const reset = process.argv.includes('--reset');

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Add ADMIN_EMAIL and ADMIN_PASSWORD to your .env file first.');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8 || !/[A-Za-z]/.test(ADMIN_PASSWORD) || !/[0-9]/.test(ADMIN_PASSWORD)) {
  console.error('❌ ADMIN_PASSWORD must be at least 8 characters with a letter and a number.');
  process.exit(1);
}

await connectDB();

try {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing && !reset) {
    console.log(`ℹ️  An admin with email ${email} already exists. Nothing changed.`);
    console.log('   To set a new password, run: npm run reset-admin');
  } else if (existing) {
    existing.password = ADMIN_PASSWORD;
    existing.tokenVersion += 1; // log out all sessions
    await existing.save();
    console.log(`✅ Password reset for ${email}`);
  } else {
    await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`✅ Admin created: ${email}`);
  }

  console.log('🔒 Now delete the ADMIN_PASSWORD line from your .env file.');
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
