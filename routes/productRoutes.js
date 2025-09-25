import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getTopProducts, getProductByQuery } from '../controllers/productController.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .get(getProductByQuery)
  .post(protect, admin, createProduct)

router.get('/top', getTopProducts);

router.route('/:id')
  .get(getProductById)

  .put(protect, admin, updateProduct)
  .put(protect, admin, deleteProduct)

router.route('/:id/reviews')
  .post(protect, createProductReview)


export default router;
