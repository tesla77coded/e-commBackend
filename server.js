import dotenv from 'dotenv';
dotenv.config();
console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET)
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js'
import path from 'path';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url'; // For ES Modules __dirname equivalent
import { stripeWebhookHandler } from './controllers/stripeController.js';
import bodyParser from 'body-parser';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};


app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.get(('/'), (req, res) => {
  res.send('API is running ...');
});

//mount API routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  });
};
