// Import required modules
const mongoose = require('mongoose');

// Define schema for product
const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  productDescription: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  productCategory: {
    type: String,
    required: true
  },
  productImage: {
    type: String, // Assuming storing image URL for simplicity
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true
  }
});

// Create a Mongoose model for product using the schema
const Product = mongoose.model('Product', productSchema);

// Export the Product model
module.exports = Product;
