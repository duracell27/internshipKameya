/**
 * Seed script — creates the initial admin account if it doesn't exist.
 * Run once: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const phone = '+380508098182';
  const existing = await User.findOne({ phone });

  if (existing) {
    console.log('Admin already exists. Skipping seed.');
  } else {
    await User.create({
      name: 'Володимир',
      phone,
      password: '27071996uA',
      role: 'admin',
    });
    console.log('Admin created: phone=+380508098182');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
