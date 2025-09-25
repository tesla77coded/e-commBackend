import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import generateToken from "../utils/generateToken.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists.');
  };

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data.');
  };
});


const loginUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && await user.matchPassword(password)) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
    console.log(`${user.name} logged in successfully.`);
  } else {
    res.status(401).json({
      message: 'Invalid email or password.'
    });
  };
});


const getUserProfile = asyncHandler(async (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(404).json({ message: 'User not found.' });
  };
});


const getUsers = asyncHandler(async (req, res) => {
  const allUsers = await User.find({}).select('-password');
  res.status(200);
  return res.json(allUsers);
});


const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    return res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('User not found.');
  };
});


const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    };

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });

  } else {
    res.status(404).json({ message: 'User not found.' });
  };
});


const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin === undefined ? user.isAdmin : Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found.');
  };
});


const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const userIdToDelete = req.params.id;

  const user = await User.findById(userIdToDelete);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  };

  // prevent admins to delete themselves
  if (req.user._id.toString() === user._id.toString()) {
    res.status(400);
    throw new Error('Admins cannot delete themselves via this route.');
  };

  await User.deleteOne({ _id: userIdToDelete });

  res.status(200).json({ message: 'User deleted successfully.' });
});


const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');

  if (user) {
    return res.status(200).json(user.wishlist);
  } else {
    res.status(404);
    throw new Error('User not found.');
  };
});


const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  };

  //check if product exists
  const productExists = await Product.findById(productId);
  if (!productExists) {
    res.status(404);
    throw new Error('Product does not exist.');
  };

  //check if prodcut is already in the wishlist
  const alreadyInWishlist = user.wishlist.some(itemObjectId => itemObjectId.equals(productId));

  if (alreadyInWishlist) {
    res.status(400);
    throw new Error('Product already added to the wishlist.');
  };

  user.wishlist.push(productId);
  await user.save();

  const updatedUser = await User.findById(req.user._id).populate('wishlist');

  res.status(200).json({
    message: 'Product added to the wishlist.',
    wishlist: updatedUser.wishlist,
  });
});


const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(400);
    throw new Error('User not found.');
  };

  const { productId } = req.params;

  user.wishlist.pull(productId);
  await user.save();

  const updatedUser = await User.findById(req.user._id).populate('wishlist');

  res.status(200).json({
    message: 'Product removed from wishlist.',
    wishlist: updatedUser.wishlist
  });
});

export { registerUser, loginUser, getUserById, getUsers, updateUserProfile, getUserProfile, updateUserByAdmin, deleteUserByAdmin, getWishlist, addToWishlist, removeFromWishlist };
