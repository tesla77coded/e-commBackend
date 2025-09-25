import Product from '../models/productModel.js';
import asyncHandler from '../utils/asyncHandler.js';

const getProducts = asyncHandler(async (req, res) => {

  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword;

  const keywordFilter = keyword ? {
    name: {
      $regex: keyword,
      $options: 'i',
    },
  } : {};

  const count = await Product.countDocuments({ ...keywordFilter });
  const products = await Product.find({ ...keywordFilter })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

const getProductByQuery = asyncHandler(async (req, res) => {
  const queryObj = {};

  // Category filter
  if (req.query.category) {
    queryObj.category = req.query.category;
  }

  // In-stock filter
  if (req.query.inStock) {
    const inStock = req.query.inStock === 'true';
    queryObj.countInStock = inStock ? { $gt: 0 } : 0;
  }

  // Price range filter
  if (req.query.price) {
    const priceFilter = {};
    if (req.query.price.gte) priceFilter.$gte = Number(req.query.price.gte);
    if (req.query.price.lte) priceFilter.$lte = Number(req.query.price.lte);
    if (Object.keys(priceFilter).length > 0) {
      queryObj.price = priceFilter;
    }
  }

  //pagination paramerters
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Base query
  let query = Product.find(queryObj);

  // Sorting
  if (req.query.sort) {
    const sortKey = req.query.sort.split('_')[0];
    const sortOrder = req.query.sort.includes('_desc') ? -1 : 1;
    query = query.sort({ [sortKey]: sortOrder });
  }

  // count for metadata
  const totalItems = await Product.countDocuments(queryObj);

  // apply pagination
  const products = await query.skip(skip).limit(limit);


  // Response
  if (products.length > 0) {
    res.status(200).json({
      products,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  } else {
    res.status(404);
    throw new Error('Products not found.');
  }
});

const getProductById = asyncHandler(async (req, res) => {
  const prodId = req.params.id;
  const product = await Product.findById(prodId);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found.');
  };
});

const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3)
  return res.status(200).send(products);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    user: req.user._id,
    image: req.body.image,
    brand: req.body.brand,
    category: req.body.category,
    countInStock: req.body.countInStock,
    numReviews: 0,
    rating: 0,
    description: req.body.description,
  });
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewd by this user.');
    };

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment: comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    return res.status(201).json({ message: 'Review added successfully.' });

  } else {
    res.status(404);
    throw new Error('Product not found.');
  };
});


const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    product.name = req.body.name || product.name;
    product.price = req.body.price === undefined ? product.price : req.body.price;
    product.description = req.body.description || product.description;
    product.image = req.body.image || product.image;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.countInStock = req.body.countInStock === undefined ? product.countInStock : req.body.countInStock;

    const updatedProduct = await product.save();
    return res.status(200).json(updatedProduct);

  } else {
    res.status(404);
    throw new Error('Product not found.');
  };
});


const deleteProduct = asyncHandler(async (req, res) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (deletedProduct) {
    return res.status(202).json({ message: 'Product deleted successfully.' });
  } else {
    res.status(404);
    throw new Error('Product not found.');
  }
});

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getTopProducts, getProductByQuery };
