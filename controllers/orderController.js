import asyncHandler from "../utils/asyncHandler.js";
import Order from "../models/orderModel.js";
import Product from '../models/productModel.js';

const addOrderItems = asyncHandler(async (req, res) => {

  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No items ordered.');
  };

  // calculate itemPrice
  let itemPrice = 0;
  const validatedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    };

    const singleItemTotal = product.price * item.qty;
    itemPrice += singleItemTotal;

    validatedItems.push({
      name: product.name,
      qty: item.qty,
      image: product.image,
      price: product.price,
      product: product._id,
    });
  };

  const taxPrice = parseFloat((itemPrice * 0.18).toFixed(2));
  const shippingPrice = itemPrice > 1000 ? 0 : 100;
  const totalPrice = parseFloat((itemPrice + taxPrice + shippingPrice).toFixed(2));

  const order = new Order({
    user: req.user._id,
    orderItems: validatedItems,
    shippingAddress,
    paymentMethod,
    itemPrice,
    taxPrice,
    totalPrice,
    shippingPrice,
    // isPaid, paidAt, isDelivered, deliveredAt will use defaults or be set later
  });

  const createdOrder = await order.save();
  return res.status(201).json(createdOrder);
});


const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email',
  )

  if (order) {
    if (req.user.isAdmin || order.user._id.toString() === req.user._id.toString()) {
      return res.status(200).json(order);
    } else {
      res.status(400);
      throw new Error('Not authorized to view this order.');
    };
  } else {
    res.status(404);
    throw new Error('Order not found.');
  };
});


const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  return res.status(200).json(orders);
});


const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name email');
  return res.status(200).json(orders);
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    return res.status(200).json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found.');
  };
});


export { addOrderItems, getOrderById, getMyOrders, getOrders, updateOrderToDelivered }
