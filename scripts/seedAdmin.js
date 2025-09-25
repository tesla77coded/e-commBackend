// scripts/seedAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

import User from '../models/userModel.js'; // ensure this path matches your project

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = 'admin@example.com';

    // if admin already exists, print id and exit
    let existing = await User.findOne({ email }).lean();
    if (existing) {
      console.log('Admin already exists:', existing._id.toString());
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user - adjust fields if your User model requires extras
    const passwordPlain = 'password123'; // change later
    const hashed = await bcrypt.hash(passwordPlain, 10);

    const admin = await User.create({
      name: 'Admin User',
      email,
      password: hashed,
      isAdmin: true,
    });

    console.log('Created admin user:', admin._id.toString());
    console.log('Admin credentials:', { email, password: passwordPlain });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding admin failed:', err);
    process.exit(1);
  }
}

seedAdmin();
