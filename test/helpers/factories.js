import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/userModel.js';
import Product from '../../models/productModel.js';
import Order from '../../models/orderModel.js';

export async function createUser(overrides = {}) {
  const password = overrides.password || 'password123';
  const hashed = await bcrypt.hash(password, 8);

  const user = new User({
    name: overrides.name || 'Test User',
    email: overrides.email || `user${Date.now()}@test.com`,
    password: hashed,
    isAdmin: overrides.isAdmin || false,
    wishlist: overrides.wishlist || [],
    ...overrides
  });

  await user.save();
  return user;
}

export function genToken(user) {
  const payload = { id: user._id.toString() };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'testsecret', { expiresIn: '7d' });
  return token;
}

export async function createProduct(overrides = {}) {
  const product = new Product({
    user: overrides.user || new mongoose.Types.ObjectId(),
    name: overrides.name || 'Sample Product',
    image: overrides.image || '/images/sample.jpg',
    brand: overrides.brand || 'Brand',
    category: overrides.category || 'general',
    description: overrides.description || 'Sample description',
    price: overrides.price != null ? overrides.price : 100,
    countInStock: overrides.countInStock != null ? overrides.countInStock : 10,
    ...overrides
  });
  await product.save();
  return product;
}

export async function createOrder(overrides = {}) {
  const order = new Order({
    user: overrides.user,
    orderItems: overrides.orderItems || [],
    shippingAddress: overrides.shippingAddress || {
      address: 'Line 1',
      city: 'City',
      postalCode: '12345',
      country: 'Country'
    },
    paymentResult: overrides.paymentResult || {},
    stripeSessionId: overrides.stripeSessionId || undefined,
    itemPrice: overrides.itemPrice || 0,
    taxPrice: overrides.taxPrice || 0,
    shippingPrice: overrides.shippingPrice || 0,
    totalPrice: overrides.totalPrice || 0,
    isDelivered: overrides.isDelivered || false,
    ...overrides
  });
  await order.save();
  return order;
}
