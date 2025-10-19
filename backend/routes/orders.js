const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   POST api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ msg: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ msg: `Insufficient stock for ${product.name}` });
      }

      // Update stock
      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    const newOrder = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount
    });

    const order = await newOrder.save();
    await order.populate('items.product');
    await order.populate('user', 'username email');
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders
// @desc    Get all orders (Admin) or user orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    let orders;

    if (user.role === 'admin') {
      orders = await Order.find()
        .populate('items.product')
        .populate('user', 'username email')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: req.user.id })
        .populate('items.product')
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const user = await require('../models/User').findById(req.user.id);
    if (order.user._id.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;