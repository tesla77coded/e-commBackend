import express from 'express';
import { admin, protect } from '../middleware/authMiddleware.js';
import { registerUser, loginUser, getUserById, getUsers, updateUserProfile, getUserProfile, updateUserByAdmin, deleteUserByAdmin, getWishlist, addToWishlist, removeFromWishlist } from '../controllers/userController.js';

const router = express.Router();

router.route('/')
  .post(registerUser)
  .get(protect, admin, getUsers)

router.post('/login', loginUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUserByAdmin)
  .delete(protect, admin, deleteUserByAdmin)

router.route('/wishlist')
.get(protect, getWishlist)
.post(protect, addToWishlist)

router.delete('/wishlist/:productId', protect,removeFromWishlist)

export default router;
