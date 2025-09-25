# E-Comm Backend

A Node.js + Express + MongoDB backend for an e-commerce app. This repository includes controllers, routes, models, and a test suite (Jest + Supertest) that runs against `mongodb-memory-server`. It also contains example seed scripts to populate an admin user and sample products.

---

## Key features

* REST API for Users, Products, Orders, Stripe checkout & webhook handling
* JWT authentication and admin authorization middleware
* Stripe checkout session creation and webhook finalization (transactional when available)
* Mongoose models for User, Product, Order
* Integration tests (10 tests) using Jest + Supertest + mongodb-memory-server
* Seed scripts for dev/demo data

---

## Quickstart

### Prerequisites

* Node.js (v18+ recommended; tested on Node 20)
* npm
* A MongoDB instance for development/production (not required for tests)

### Install

```bash
git clone https://github.com/tesla77coded/e-commBackend.git
cd e-commBackend
npm install
```

### Environment

Create a `.env` file in the project root (do **not** commit it). You can copy `.env.example` if present.

Required environment variables used in the project:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/yourdb
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:3000
```


### Run in development

```bash
npm run dev
```

This starts the Express app with `nodemon` (server entry `server.js`). For tests the app is exported so it can be imported by Supertest without starting the HTTP listener.

---

## Tests

The repo uses Jest + Supertest and runs tests against `mongodb-memory-server` for isolation.

**Run tests**

```bash
npm test
```

> Note: Because this project uses ESM (`type: module` in package.json), the `test` script runs Jest under Node's ESM mode. The script in `package.json` includes the required `--experimental-vm-modules` flag.

### Test files

* `test/product.test.js` — product endpoints
* `test/user.test.js` — user endpoints (register/login, RBAC)
* `test/orderStripe.test.js` — orders and Stripe flow
* `test/helpers/*` — test helpers and factories

---

## Seeding the database

Seed scripts are available in the `scripts/` folder (e.g. `scripts/seedAdmin.js`, `scripts/seedProducts.js`). They are useful for local development.

Add convenient npm scripts in `package.json`:

```json
{
  "scripts": {
    "seed:admin": "node scripts/seedAdmin.js",
    "seed:products": "node scripts/seedProducts.js",
    "seed:all": "node scripts/seedAdmin.js && node scripts/seedProducts.js"
  }
}
```

Run them like:

```bash
npm run seed:admin
npm run seed:products
```

Make sure your `.env` points to a dev database when running seeds.

---

## Stripe notes

* The app creates Checkout Sessions and saves `stripeSessionId` on the Order for idempotency.
* The webhook handler validates signatures in production using `STRIPE_WEBHOOK_SECRET`.
* For tests we bypass signature verification (only when `NODE_ENV === 'test'`) to make webhook calls easy and deterministic. Production verification remains unchanged.

If you prefer not to bypass signature checking in tests, you can instead generate a valid Stripe test signature in your tests (more complex).

---
---

## Project structure (high level)

```
controllers/        # route handlers
models/             # mongoose models
routes/             # express routers
middleware/         # auth & error handlers
utils/              # small helpers (generateToken, asyncHandler)
scripts/            # seed scripts
test/               # integration tests + helpers
server.js           # app entry (exports app for tests)
package.json
```

---

## Common troubleshooting

* **ESM / Jest errors**: Ensure `jest.config.cjs` exists and `package.json` test script uses `node --experimental-vm-modules` to run Jest. If you see `Cannot use import statement outside a module`, double-check `type: module` in `package.json` and your Jest config.
* **Webhook test failing due to signature**: Tests run in `NODE_ENV=test` so the controller uses a test-friendly parsing path. Do not rely on that bypass in production.
* **Transactions failing in tests**: `mongodb-memory-server` isn't a replica set; code attempts transactions only when supported and falls back to a non-transactional path.

---
## API Documentation

- **Swagger UI**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)  
- **Swagger JSON**: [http://localhost:8080/swagger.json](http://localhost:8080/swagger.json)  
- **ReDoc**: [http://localhost:8080/docs](http://localhost:8080/docs)  

### Postman Collection

You can also explore the API using Postman. Import the provided collection file:

- [`docs/postman_collection.json`](./docs/postman_collection.json)


### Postman collection 

Import the ready-made Postman collection:

**Raw URL (copy this into Postman → Import → Link):**

`https://raw.githubusercontent.com/tesla77coded/e-commBackend/main/docs/postman_collection.json`

Steps:
1. Open Postman (desktop or web).
2. Click **Import** → **Link** (or paste into the URL box).
3. Paste the raw URL above and click **Import**.
4. In the imported collection, set the collection variable `baseUrl` to your server (e.g. `http://localhost:8080`) and copy your JWT into `{{token}}`.


---
## Contributing

PRs welcome. If you add features, please:

* add tests for new functionality
* update README and `.env.example` if new env vars required

---
