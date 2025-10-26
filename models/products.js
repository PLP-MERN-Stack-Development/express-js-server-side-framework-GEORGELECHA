//models to handle products
const mongoose = require('mongoose');


const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true }
    
}, {timestamps: true});

const Product = mongoose.model('Product', ProductSchema);
Product.createIndexes(); // Create indexes for better performance
// Export the Product model

module.exports = Product;

// This code defines a Mongoose model for a product in an e-commerce application.
// The `productSchema` specifies the structure of the product data, including fields like id, name, description, price, category, and inStock status.
// The model is then exported for use in other parts of the application.

//WOrk of the models: // 1. Define the structure of the product data.
// 2. Specify the data types and validation rules for each field.
// 3. Enable timestamps to automatically manage createdAt and updatedAt fields.
// 4. Export the model so it can be used in other parts of the application.

// This model can be used to create, read, update, and delete products in the database.
// It provides a structured way to interact with product data in MongoDB using Mongoose.


//work of the schema: // 1. Define the structure of the product data.