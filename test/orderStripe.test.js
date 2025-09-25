import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { connect, closeDatabase, clearDatabase } from './helpers/setupDB.js';
import { createUser, genToken, createProduct, createOrder } from './helpers/factories.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

jest.mock('stripe', () => {
  return function Stripe() {
    return {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.test/session/cs_test_123' })
        }
      },
      webhooks: {
        constructEvent: jest.fn((body, sig, secret) => body)
      }
    };
  };
});

beforeAll(async () => {
  await connect();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  // Ensure webhook secret exists (not used in test path, but keep it defined)
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
});

afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Orders and Stripe', () => {
  test('Create order (POST /api/orders) creates order (stock unchanged until webhook)', async () => {
    const user = await createUser();
    const token = genToken(user);
    const product = await createProduct({ countInStock: 3, price: 100, user: user._id });

    const payload = {
      orderItems: [{ productId: product._id.toString(), qty: 2 }],
      shippingAddress: { address: 'x', city: 'y', postalCode: '000', country: 'Z' },
      paymentMethod: 'card'
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const order = await Order.findById(res.body._id);
    expect(order).toBeTruthy();

    const updated = await Product.findById(product._id);
    expect(updated.countInStock).toBe(3);
  });

  test('Creating order with non-existent product returns 404', async () => {
    const user = await createUser();
    const token = genToken(user);

    const payload = {
      orderItems: [{ productId: '64b6f2fcf2b1a2a1a1a1a1a1', qty: 1 }],
      shippingAddress: { address: 'x', city: 'y', postalCode: '000', country: 'Z' },
      paymentMethod: 'card'
    };

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404);
  });

  test('Get order by id: owner can fetch, admin can fetch others', async () => {
    const user = await createUser();
    const token = genToken(user);
    const product = await createProduct({ countInStock: 5, price: 20, user: user._id });

    const order = await createOrder({
      user: user._id,
      orderItems: [{
        name: product.name,
        qty: 1,
        image: product.image,
        price: product.price,
        product: product._id
      }],
      itemPrice: product.price,
      totalPrice: product.price,
    });

    // owner fetch
    await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // another non-admin should be forbidden
    const other = await createUser({ isAdmin: false, email: 'other@test.com' });
    const otherToken = genToken(other);
    await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(400);

    // admin can fetch
    const admin = await createUser({ isAdmin: true, email: 'adm@test.com' });
    const adminToken = genToken(admin);
    await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  test('Stripe create-checkout-session (POST /api/stripe/create-checkout-session) returns session id (mocked)', async () => {
    const user = await createUser();
    const token = genToken(user);
    const product = await createProduct({ price: 100, user: user._id });

    // Provide user and shippingAddress because Order schema requires them
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        shippingAddress: { address: 'addr', city: 'City', postalCode: '00000', country: 'Country' },
        items: [{ product: product._id.toString(), qty: 1 }]
      })
      .expect(200);

    expect(typeof res.body.sessionId).toBe('string');
    // Optionally verify the Order got updated with session id:
    const orderInDb = await (await import('../models/orderModel.js')).default.findOne({ stripeSessionId: res.body.sessionId });
    expect(orderInDb).toBeTruthy();

  });

  test('Stripe webhook marks order paid and decrements stock (POST /api/stripe/webhook)', async () => {
    const user = await createUser();
    const product = await createProduct({ countInStock: 4, price: 50, user: user._id });

    const order = await createOrder({
      user: user._id,
      orderItems: [{
        name: product.name,
        qty: 2,
        image: product.image,
        price: product.price,
        product: product._id
      }],
      itemPrice: product.price * 2,
      totalPrice: product.price * 2,
    });

    const fakeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'pi_test_123',
          payment_intent: 'pi_test_123',
          metadata: { mongoOrderId: order._id.toString() },
        }
      }
    };

    // Because stripeController now skips signature verification in NODE_ENV==='test',
    // constructEvent won't be required. POSTing this JSON body will be accepted.
    await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'test-signature')
      .send(fakeEvent)
      .expect(200);
    const updatedOrder = await Order.findById(order._id);

    expect(updatedOrder.paymentResult).toBeDefined();
    expect(updatedOrder.paymentResult.status).toBe('paid');
    expect(updatedOrder.stripePaymentIntentId).toBe('pi_test_123');

    // stock should be decremented by qty = 2
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.countInStock).toBe(2);
  });
});
