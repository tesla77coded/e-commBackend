import request from 'supertest';
import app from '../server.js';
import { connect, closeDatabase, clearDatabase } from './helpers/setupDB.js';
import { createUser, genToken, createProduct } from './helpers/factories.js';
import Product from '../models/productModel.js';

beforeAll(async () => {
  await connect();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testSecret';
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Product API', () => {
  test('Admin can create a product (POST /api/products)', async () => {
    const admin = await createUser({ isAdmin: true });
    const token = genToken(admin);

    const payload = {
      name: 'New Prod',
      image: '/images/new.png',
      brand: 'abC',
      category: 'electronics',
      description: 'iphones',
      price: 150,
      countInStock: 20,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)

    expect(res.body).toHaveProperty('_id')
    const dbProd = await Product.findById(res.body._id);
    expect(dbProd.name).toBe('New Prod');
    expect(dbProd.countInStock).toBe(20);
  });

  test('GET /api/products returns products and supports a simple category filter', async () => {
    await createProduct({ name: 'A', category: 'c1' });
    await createProduct({ name: 'B', category: 'c2' });

    const res = await request(app)
      .get('/api/products?category=c1')
      .expect(200);

    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.some(p => p.category === 'c1')).toBe(true);
  });

  test('PUT /api/products/:id updates countInStock (admin)', async () => {
    const admin = await createUser({ isAdmin: true });
    const token = genToken(admin);
    const p = await createProduct({ countInStock: 12 });

    const res = await request(app)
      .put(`/api/products/${p._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ countInStock: 6 })
      .expect(200);

    const updated = await Product.findById(p._id);
    expect(updated.countInStock).toBe(6);
  });
});
