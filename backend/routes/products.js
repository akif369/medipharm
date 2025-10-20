const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes like /:id

// @route   GET api/products/template
// @desc    Download CSV template
// @access  Private (Admin only)
router.get('/template', [auth, admin], (req, res) => {
  const csvContent = 'name,description,category,price,stock,manufacturer,rackNo,expiryDate\n' +
    'Paracetamol 500mg,Pain reliever and fever reducer,Medicine,5.99,100,PharmaCorp,A1,2025-12-31\n' +
    'Bandage Roll,Sterile cotton bandage,Medical Supplies,3.50,200,MediSupply,B5,\n' +
    'Surgical Gloves,Latex-free surgical gloves,Medical Supplies,12.99,150,SafeMed,C3,2026-06-30';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=products-template.csv');
  res.send(csvContent);
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

// @route   POST api/products/bulk-upload
// @desc    Bulk upload products from CSV/TXT
// @access  Private (Admin only)
router.post('/bulk-upload', [auth, admin, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const products = [];
    const errors = [];
    let lineNumber = 1; // Start from 1 (header is line 1)

    // Read and parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;
        try {
          // Validate required fields
          if (!row.name || !row.description || !row.category || !row.price || !row.manufacturer) {
            errors.push({
              line: lineNumber,
              data: row,
              error: 'Missing required fields (name, description, category, price, manufacturer)'
            });
            return;
          }

          const product = {
            name: row.name.trim(),
            description: row.description.trim(),
            category: row.category.trim(),
            price: parseFloat(row.price),
            stock: parseInt(row.stock) || 0,
            manufacturer: row.manufacturer.trim(),
            rackNo: row.rackNo?.trim() || 'A1',
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null
          };

          // Validate data types
          if (isNaN(product.price) || product.price < 0) {
            errors.push({
              line: lineNumber,
              data: row,
              error: 'Invalid price value (must be a positive number)'
            });
            return;
          }

          if (isNaN(product.stock) || product.stock < 0) {
            errors.push({
              line: lineNumber,
              data: row,
              error: 'Invalid stock value (must be a positive number)'
            });
            return;
          }

          products.push(product);
        } catch (err) {
          errors.push({
            line: lineNumber,
            data: row,
            error: err.message
          });
        }
      })
      .on('end', async () => {
        try {
          let insertedProducts = [];
          
          if (products.length > 0) {
            // Insert all valid products
            insertedProducts = await Product.insertMany(products, { ordered: false });
          }

          // Delete uploaded file
          fs.unlinkSync(filePath);

          res.json({
            success: true,
            inserted: insertedProducts.length,
            totalRows: lineNumber - 1, // Exclude header
            errors: errors.length,
            errorDetails: errors.slice(0, 10) // Limit to first 10 errors
          });
        } catch (err) {
          // Delete uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.status(500).json({
            msg: 'Error inserting products',
            error: err.message,
            inserted: 0,
            errors: errors.length,
            errorDetails: errors.slice(0, 10)
          });
        }
      })
      .on('error', (err) => {
        // Delete uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(500).json({
          msg: 'Error reading file',
          error: err.message
        });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

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
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
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