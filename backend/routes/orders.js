const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   POST api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body;

    // Check if user has complete address
    const user = await User.findById(req.user.id);
    if (!user.address || !user.address.street || !user.address.city) {
      return res.status(400).json({ 
        msg: 'Please complete your address before placing an order',
        requiresAddress: true
      });
    }

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
      totalAmount,
      shippingAddress: user.address,
      status: 'pending' // Changed from 'completed' to 'pending'
    });

    const order = await newOrder.save();
    await order.populate('items.product');
    await order.populate('user', 'username email phoneNumber address');
    
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
    const user = await User.findById(req.user.id);
    let orders;

    if (user.role === 'admin') {
      orders = await Order.find()
        .populate('items.product')
        .populate('user', 'username email phoneNumber address')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: req.user.id })
        .populate('items.product')
        .populate('user', 'username email phoneNumber address')
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders/stats
// @desc    Get order statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      processingOrders,
      shippedOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
    });
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
      .populate('user', 'username email phoneNumber address');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const user = await User.findById(req.user.id);
    if (order.user._id.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', [auth, admin], async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // If cancelling order, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (let item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('items.product')
      .populate('user', 'username email phoneNumber address');

    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/orders/:id
// @desc    Delete order (Admin only)
// @access  Private (Admin)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Restore stock if order is being deleted
    if (order.status !== 'cancelled') {
      for (let item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    await order.deleteOne();
    res.json({ msg: 'Order removed and stock restored' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;