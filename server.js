// server.js - Updated with all middleware
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config /dbConnector');

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');


// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const ecomApp = express();
const PORT = process.env.PORT || 3000;

// Middleware setup

// 1. Custom logger middleware (logs all requests)
ecomApp.use(logger);

// 2. JSON body parser middleware
ecomApp.use(bodyParser.json());

// 3. Connect to MongoDB using Mongoose
connectDB();

// Routes
ecomApp.use('/api/products', require('./routes/productRoutes'));

// Root route
ecomApp.get('/', (req, res) => {
    res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// Health check route (no authentication required)
ecomApp.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Product API'
    });
});



// 4. Global error handling middleware (should be last)
ecomApp.use(errorHandler);

// Export the app for testing purposes
module.exports = ecomApp; 

// Start the server
ecomApp.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});