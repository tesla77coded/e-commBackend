/**
 * @swagger
 * /api/stripe/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout Session for an order
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mongoOrderId:
 *                 type: string
 *                 description: Optional existing order _id in the DB
 *               orderId:
 *                 type: string
 *                 description: external order id
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               shippingAddress:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     summary: Stripe webhook endpoint (raw body required)
 *     tags:
 *       - Stripe
 *     description: |
 *       This endpoint expects the raw request body (use Stripe's webhook signature verification in production).
 *       In test mode (`NODE_ENV=test`) signature verification is bypassed for deterministic tests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */


import express from 'express';
import { createCheckoutSession, stripeWebhookHandler } from '../controllers/stripeController.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

export default router;
