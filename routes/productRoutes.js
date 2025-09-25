/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get paginated list of products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *   post:
 *     summary: Create a new product (admin only)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Created product
 */

/**
 * @swagger
 * /api/products/top:
 *   get:
 *     summary: Get top rated products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Top products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   put:
 *     summary: Update product (admin only)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Updated product
 *   delete:
 *     summary: Delete product (admin only)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Product deleted
 */

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review to a product (authenticated users)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

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
