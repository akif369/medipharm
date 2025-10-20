const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  manufacturer: {
    type: String,
    required: true
  },
  rackNo: {
    type: String,
    required: true,
    default: 'A1'
  },
  expiryDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better search performance
ProductSchema.index({ name: 'text', description: 'text', manufacturer: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ rackNo: 1 });

module.exports = mongoose.model('Product', ProductSchema);