import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// routes & controllers
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import { stripeWebhookHandler } from './controllers/stripeController.js';

// middleware
import { notFound, errorHandler } from './middleware/errorHandler.js';

// swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { compareSync } from 'bcryptjs';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT;

// connect DB helper
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// stripe webhook expects raw body — mount BEFORE express.json()
// hook raw route directly
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// body parser for normal JSON routes
app.use(express.json());
app.use(cors());
// static uploads and public
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// basic health route
app.get('/', (req, res) => {
  res.send('API is running ...');
});

// API routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);

// === Swagger / ReDoc / swagger.json ===
try {
  const publicDir = path.join(__dirname, 'public');
  const outPath = path.join(publicDir, 'swagger.json');
  fs.mkdirSync(publicDir, { recursive: true });

  const swaggerJson = JSON.stringify(swaggerSpec, null, 2);

  let shouldWrite = true;
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    if (existing === swaggerJson) shouldWrite = false;
  }
  if (shouldWrite) {
    fs.writeFileSync(outPath, swaggerJson);
    console.log('Wrote public/swagger.json');
  }
} catch (err) {
  console.warn('Could not write swagger.json to public/:', err.message);
}

// Expose docs & spec
if (process.env.NODE_ENV !== 'production') {
  // Swagger UI 
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // raw json 
  app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });

  // ReDoc 
  app.get('/docs', (req, res) => {
    res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>API Docs — ReDoc</title>
  </head>
  <body>
    <redoc spec-url='/swagger.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
  });
} else {
  app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });
}

// error handlers 
app.use(notFound);
app.use(errorHandler);

// export app for tests 
export default app;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  });
}
