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

