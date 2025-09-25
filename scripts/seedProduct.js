// scripts/seedProduct.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Product from '../models/productModel.js'; // adjust path if needed
import User from '../models/userModel.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminEmail = 'admin@example.com';

    const admin = await User.findOne({ email: adminEmail }).lean();
    if (!admin) {
      console.error(`Admin user not found with email ${adminEmail}. Run the admin seed first.`);
      process.exit(1);
    }

    // Remove any previous test product with same name
    await Product.deleteMany({ name: 'TEST PRODUCT - Stripe Seed' });

    const product = await Product.create({
      user: admin._id,
      name: 'TEST PRODUCT - Stripe Seed',
      image: '/images/test.png',
      brand: 'SeedBrand',
      category: 'testing',
      description: 'A test product used for Stripe Checkout flow.',
      price: 499,        // price in rupees
      countInStock: 10,
      rating: 0,
      numReviews: 0,
    });

    console.log('Seeded product:', product._id.toString());
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
