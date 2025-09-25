import request from 'supertest';
import app from '../server.js';
import { connect, closeDatabase, clearDatabase } from './helpers/setupDB.js';
import { createUser, genToken } from './helpers/factories.js';
import User from '../models/userModel.js';

beforeAll(async () => {
  await connect();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('User API', () => {
  test('Register and login flow (POST /api/users -> /api/users/login)', async () => {
    const regRes = await request(app).post('/api/users').send({
      name: 'Hello',
      email: 'hello@test.com',
      password: 'password123'
    }).expect(201);

    const dbUser = await User.findOne({ email: 'hello@test.com' });
    expect(dbUser).toBeTruthy();

    // login
    const loginRes = await request(app).post('/api/users/login').send({
      email: 'hello@test.com',
      password: 'password123'
    }).expect(200);

    expect(loginRes.body).toHaveProperty('token');

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .expect(200);

    expect(res.body.email).toBe('hello@test.com');
  });

  test('RBAC: non-admin blocked from admin route (/api/users) and admin can access', async () => {
    const user = await createUser({ isAdmin: false });
    const token = genToken(user);

    await request(app).get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    const admin = await createUser({ isAdmin: true, email: 'adm@test.com' });
    const adminToken = genToken(admin);

    await request(app).get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
