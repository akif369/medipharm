const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET api/products
// @desc    Get all products with search, filter, and sort
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      stockStatus,
      rackNo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { rackNo: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by stock status
    if (stockStatus) {
      switch(stockStatus) {
        case 'in-stock':
          query.stock = { $gt: 10 };
          break;
        case 'low-stock':
          query.stock = { $gt: 0, $lte: 10 };
          break;
        case 'out-of-stock':
          query.stock = 0;
          break;
      }
    }

    // Filter by rack number
    if (rackNo && rackNo !== 'all') {
      query.rackNo = rackNo;
    }

    // Determine sort order
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find(query).sort(sortOptions);
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/products/categories
// @desc    Get all unique categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/products/racks
// @desc    Get all unique rack numbers
// @access  Public
router.get('/racks', async (req, res) => {
  try {
    const racks = await Product.distinct('rackNo');
    res.json(racks.sort());
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/products
// @desc    Add new product
// @access  Private (Admin only)
router.post('/', [auth, admin], async (req, res) => {
  try {
    const { name, description, category, price, stock, manufacturer, rackNo, expiryDate } = req.body;

    const newProduct = new Product({
      name,
      description,
      category,
      price,
      stock,
      manufacturer,
      rackNo: rackNo || 'A1',
      expiryDate
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { name, description, category, price, stock, manufacturer, rackNo, expiryDate } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.manufacturer = manufacturer || product.manufacturer;
    product.rackNo = rackNo || product.rackNo;
    product.expiryDate = expiryDate || product.expiryDate;
    product.updatedAt = Date.now();

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;