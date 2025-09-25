import express from 'express';
import { createCheckoutSession, stripeWebhookHandler } from '../controllers/stripeController.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

export default router;
