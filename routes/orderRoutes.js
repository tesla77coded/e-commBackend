/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (authenticated users)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItems
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               orderItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               shippingAddress:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *               paymentMethod:
 *                 type: string
 *                 example: card
 *     responses:
 *       201:
 *         description: Created order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: Get all orders (admin only)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get current user's orders
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of orders belonging to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID (owner or admin)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the order
 *     responses:
 *       200:
 *         description: Order object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/orders/{id}/deliver:
 *   put:
 *     summary: Mark order as delivered (admin only)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id to mark delivered
 *     responses:
 *       200:
 *         description: Updated order marked delivered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { addOrderItems, getMyOrders, getOrderById, getOrders, updateOrderToDelivered } from '../controllers/orderController.js';

const router = express.Router();

router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders)

router.get('/myorders', protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById)

export default router;

