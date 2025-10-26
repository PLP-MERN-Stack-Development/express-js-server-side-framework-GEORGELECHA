const express = require('express');
const router = express.Router();
const Product = require('../models/products');

// Import middleware for authentication and validation
const authenticate = require('../middleware/auth');
const validateProduct = require('../middleware/validation');

// ===== SPECIFIC ROUTES FIRST (Must come before parameterized routes) =====

/**
 * TEST ROUTE - Simple endpoint to verify routing is working
 * Purpose: Debugging and health check for the products routes
 * Access: Public
 */
router.get("/test", (req, res) => {
    console.log('=== TEST ROUTE HIT ===');
    res.json({ 
        message: "Test route is working!", 
        timestamp: new Date().toISOString() 
    });
});

/**
 * SEARCH ENDPOINT - Full-text search across multiple product fields
 * Purpose: Allow users to search products by name, description, or category
 * Features: Pagination, case-insensitive search, multiple field search
 * Access: Public
 * Query Parameters:
 *   - q (required): Search term
 *   - page: Page number for pagination (default: 1)
 *   - limit: Number of items per page (default: 10)
 */
router.get("/search", async (req, res) => {
    console.log('SEARCH ENDPOINT HIT');
    
    try {
        const { 
            q,           // Search query (required)
            page = 1,    // Pagination: page number
            limit = 10   // Pagination: items per page
        } = req.query;
        
        // Validate that search query is provided
        if (!q || q.trim() === '') {
            return res.status(400).json({ 
                message: "Search query 'q' is required",
                example: "/api/products/search?q=phone&page=1&limit=5"
            });
        }
        
        const searchTerm = q.trim();
        
        /**
         * Build search filter using MongoDB $or operator
         * Searches in three fields with case-insensitive regex:
         * - name: Product name
         * - description: Product description  
         * - category: Product category
         * $options: 'i' makes the search case-insensitive
         */
        const searchFilter = {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },        // Search in product name
                { description: { $regex: searchTerm, $options: 'i' } }, // Search in description
                { category: { $regex: searchTerm, $options: 'i' } }     // Search in category
            ]
        };
        
        // Pagination calculations
        const pageNum = Math.max(1, parseInt(page));    // Ensure page is at least 1
        const limitNum = Math.max(1, parseInt(limit));  // Ensure limit is at least 1
        const skip = (pageNum - 1) * limitNum;          // Calculate how many documents to skip
        
        console.log(`Searching for: "${searchTerm}", Page: ${pageNum}, Limit: ${limitNum}`);
        
        // Execute search query with pagination and sorting
        const products = await Product.find(searchFilter)
            .sort({ name: 1 }) // Sort by name ascending (alphabetical order)
            .skip(skip)        // Skip documents for pagination
            .limit(limitNum);  // Limit number of results per page
        
        // Get total count of matching documents for pagination info
        const totalResults = await Product.countDocuments(searchFilter);
        const totalPages = Math.ceil(totalResults / limitNum); // Calculate total pages needed
        
        console.log(`Search found ${totalResults} total results, showing ${products.length}`);
        
        // Return structured response with search metadata and results
        res.status(200).json({
            search: {
                query: searchTerm,
                totalResults: totalResults,
                currentPage: pageNum,
                totalPages: totalPages,
                hasNext: pageNum < totalPages,    // Is there a next page?
                hasPrev: pageNum > 1              // Is there a previous page?
            },
            results: products.length,
            products: products
        });
        
    } catch (error) {
        console.error("Search error:", error.message);
        res.status(500).json({ 
            message: "Search failed", 
            error: error.message 
        });
    }
});

/**
 * STATISTICS ENDPOINT - Product analytics and business intelligence
 * Purpose: Provide aggregated data for dashboards and reporting
 * Features: Category breakdown, price analytics, stock statistics
 * Access: Public
 * Uses MongoDB aggregation pipeline for complex data analysis
 */
router.get("/stats", async (req, res) => {
    console.log('STATISTICS ENDPOINT HIT');
    
    try {
        // Get basic product counts
        const totalProducts = await Product.countDocuments();
        const inStockCount = await Product.countDocuments({ inStock: true });
        const outOfStockCount = await Product.countDocuments({ inStock: false });
        
        /**
         * MONGODB AGGREGATION PIPELINE - Category Statistics
         * Pipeline stages:
         * 1. $group: Group products by category and calculate aggregates
         * 2. $sort: Sort categories by product count (descending)
         * 3. $project: Format and rename fields for clean output
         */
        const categoryStats = await Product.aggregate([
            // Stage 1: Group by category and calculate metrics
            {
                $group: {
                    _id: "$category",                    // Group by category field
                    count: { $sum: 1 },                 // Count products in category
                    averagePrice: { $avg: "$price" },   // Calculate average price
                    totalValue: { $sum: "$price" },     // Sum of all prices in category
                    minPrice: { $min: "$price" },       // Find minimum price
                    maxPrice: { $max: "$price" },       // Find maximum price
                    // Count in-stock products using conditional sum
                    inStockCount: {
                        $sum: { 
                            $cond: [{ $eq: ["$inStock", true] }, 1, 0] 
                        }
                    },
                    // Count out-of-stock products using conditional sum
                    outOfStockCount: {
                        $sum: { 
                            $cond: [{ $eq: ["$inStock", false] }, 1, 0] 
                        }
                    }
                }
            },
            // Stage 2: Sort by product count (most popular categories first)
            {
                $sort: { count: -1 } // -1 = descending order
            },
            // Stage 3: Format the output fields
            {
                $project: {
                    category: "$_id",           // Rename _id to category
                    count: 1,                   // Keep count field
                    averagePrice: { $round: ["$averagePrice", 2] },     // Round to 2 decimals
                    totalValue: { $round: ["$totalValue", 2] },         // Round to 2 decimals
                    minPrice: 1,                // Keep original value
                    maxPrice: 1,                // Keep original value
                    inStockCount: 1,            // Keep calculated count
                    outOfStockCount: 1,         // Keep calculated count
                    // Calculate in-stock percentage
                    inStockPercentage: {
                        $round: [
                            { 
                                $multiply: [
                                    { $divide: ["$inStockCount", "$count"] }, 
                                    100 
                                ] 
                            },
                            2  // Round to 2 decimal places
                        ]
                    }
                }
            }
        ]);
        
        /**
         * Overall Price Statistics Aggregation
         * Groups all products together (_id: null) to get overall metrics
         */
        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,  // Group all documents together
                    averagePrice: { $avg: "$price" },
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    totalInventoryValue: { $sum: "$price" }
                }
            }
        ]);
        
        console.log(`Statistics generated for ${totalProducts} products`);
        
        // Return comprehensive statistics response
        res.status(200).json({
            summary: {
                totalProducts: totalProducts,
                inStock: inStockCount,
                outOfStock: outOfStockCount,
                inStockPercentage: totalProducts > 0 ? 
                    ((inStockCount / totalProducts) * 100).toFixed(2) : 0
            },
            priceStatistics: priceStats[0] ? {
                averagePrice: Math.round(priceStats[0].averagePrice * 100) / 100,
                minPrice: priceStats[0].minPrice,
                maxPrice: priceStats[0].maxPrice,
                totalInventoryValue: Math.round(priceStats[0].totalInventoryValue * 100) / 100
            } : {},  // Handle case when no products exist
            categories: categoryStats,
            lastUpdated: new Date().toISOString()  // Timestamp for data freshness
        });
        
    } catch (error) {
        console.error("Statistics error:", error.message);
        res.status(500).json({ 
            message: "Failed to get statistics", 
            error: error.message 
        });
    }
});

// ===== MAIN PRODUCTS ENDPOINT WITH FILTERING & PAGINATION =====

/**
 * GET ALL PRODUCTS - Advanced endpoint with filtering, pagination, and sorting
 * Purpose: Main endpoint for product listing with enterprise features
 * Features: 
 *   - Filtering by category, stock status, price range
 *   - Pagination for large datasets
 *   - Sorting by any field
 *   - Field selection to reduce payload size
 * Access: Public
 * Query Parameters:
 *   - category: Filter by exact category name
 *   - inStock: Filter by availability (true/false)
 *   - minPrice/maxPrice: Price range filtering
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - sort: Sort field with optional - prefix for descending
 *   - fields: Comma-separated list of fields to return
 */
router.get("/", async (req, res) => {
    console.log('GET ALL PRODUCTS with FILTERING & PAGINATION');
    console.log('Query parameters:', req.query);
    
    try {
        // Destructure query parameters with default values
        const { 
            category,      // Filter by exact category
            inStock,       // Filter by stock status
            minPrice,      // Filter by minimum price
            maxPrice,      // Filter by maximum price
            page = 1,      // Pagination: current page (default: 1)
            limit = 10,    // Pagination: items per page (default: 10)
            sort = 'name', // Sort field (default: name, prefix with - for descending)
            fields         // Field selection (comma-separated list)
        } = req.query;
        
        // ===== FILTERING LOGIC =====
        const filter = {};
        
        /**
         * CATEGORY FILTER - Exact match with case insensitivity
         * Uses regex with ^ and $ anchors for exact matching
         * $options: 'i' makes it case-insensitive
         */
        if (category && category.trim() !== '') {
            const cleanCategory = category.trim();
            filter.category = { $regex: new RegExp(`^${cleanCategory}$`, 'i') };
            console.log(`Filtering by category: "${cleanCategory}"`);
        }
        
        // STOCK STATUS FILTER - Convert string to boolean
        if (inStock !== undefined) {
            filter.inStock = inStock === 'true'; // Convert 'true' string to boolean true
            console.log(`Filtering by inStock: ${filter.inStock}`);
        }
        
        // PRICE RANGE FILTER - Using MongoDB comparison operators
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) {
                filter.price.$gte = parseFloat(minPrice); // $gte = greater than or equal
                console.log(`Filtering by minPrice: $${filter.price.$gte}`);
            }
            if (maxPrice) {
                filter.price.$lte = parseFloat(maxPrice); // $lte = less than or equal
                console.log(`Filtering by maxPrice: $${filter.price.$lte}`);
            }
        }
        
        // ===== PAGINATION LOGIC =====
        const pageNum = Math.max(1, parseInt(page));                    // Ensure page is at least 1
        const limitNum = Math.max(1, Math.min(parseInt(limit), 100));  // Limit to max 100 items per page
        const skip = (pageNum - 1) * limitNum;                         // Calculate documents to skip
        
        console.log(`Pagination - Page: ${pageNum}, Limit: ${limitNum}, Skip: ${skip}`);
        
        // ===== SORTING LOGIC =====
        let sortOptions = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            sortOptions[sortField] = sortOrder;
            console.log(`Sorting by: ${sortField} (${sortOrder === 1 ? 'asc' : 'desc'})`);
        }
        
        // ===== FIELD SELECTION LOGIC =====
        /**
         * FIELD SELECTION - Project only specific fields to reduce response size
         * Example: fields=name,price returns only name and price fields
         */
        let fieldSelection = {};
        if (fields) {
            const fieldList = fields.split(',').map(field => field.trim());
            fieldList.forEach(field => {
                fieldSelection[field] = 1; // 1 means include this field
            });
            console.log(`Selecting fields:`, fieldList);
        }
        
        // ===== DATABASE QUERY EXECUTION =====
        console.log('Final filter:', JSON.stringify(filter, null, 2));
        
        // Build the database query
        let query = Product.find(filter);
        
        // Apply field selection if specified (projection)
        if (Object.keys(fieldSelection).length > 0) {
            query = query.select(fieldSelection);
        }
        
        // Execute the final query with sorting and pagination
        const products = await query
            .sort(sortOptions)  // Apply sorting
            .skip(skip)         // Apply pagination skip
            .limit(limitNum);   // Apply pagination limit
        
        // Get total count of documents matching the filter
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNum);
        
        console.log(`Found ${products.length} products (${totalProducts} total)`);
        
        // ===== RESPONSE STRUCTURE =====
        res.status(200).json({
            // Pagination metadata for client navigation
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalProducts: totalProducts,
                productsPerPage: limitNum,
                hasNext: pageNum < totalPages,      // Can go to next page?
                hasPrev: pageNum > 1,               // Can go to previous page?
                nextPage: pageNum < totalPages ? pageNum + 1 : null,
                prevPage: pageNum > 1 ? pageNum - 1 : null
            },
            // Applied filters (for transparency and debugging)
            filters: {
                category: category || null,
                inStock: inStock !== undefined ? (inStock === 'true') : null,
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                sort: sort,
                fields: fields || null
            },
            // Actual results
            count: products.length,
            products: products
        });
        
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
});

// ===== PARAMETERIZED ROUTES LAST (Must come after specific routes) =====

/**
 * GET PRODUCT BY ID - Fetch a single product by its MongoDB ID
 * Purpose: Retrieve detailed information about a specific product
 * Access: Public
 * URL Parameter: id - MongoDB ObjectId of the product
 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching product:", error.message);
        res.status(404).json({ message: "Product Not Found" });
    }
});

/**
 * CREATE PRODUCT - Add a new product to the database
 * Purpose: Add new products to the inventory
 * Features: Authentication required, data validation
 * Access: Protected (requires valid API key)
 * Middleware: 
 *   - authenticate: Verifies API key
 *   - validateProduct: Validates request body data
 */
router.post("/", authenticate, validateProduct, async (req, res) => {
    const { name, description, price, category, inStock } = req.body;

    try {
        // Create new product instance with provided data
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            inStock: inStock !== undefined ? inStock : true // Default to true if not provided
        });

        // Save to database
        const savedProduct = await newProduct.save();
        
        // Return success response with created product
        res.status(201).json({
            message: "Product created successfully",
            product: savedProduct
        });
    } catch (error) {
        console.error("Error creating product:", error.message);
        res.status(500).json({ message: "Creating New Product was unsuccessful!" });
    }
});

/**
 * UPDATE PRODUCT - Modify an existing product
 * Purpose: Update product information
 * Features: Authentication, validation, returns updated document
 * Access: Protected (requires valid API key)
 * URL Parameter: id - MongoDB ObjectId of the product to update
 */
router.put("/:id", authenticate, validateProduct, async (req, res) => {
    try {
        // findByIdAndUpdate returns the updated document and runs validators
        const productToUpdate = await Product.findByIdAndUpdate(
            req.params.id,           // Product ID from URL parameter
            req.body,                // Update data from request body
            { 
                new: true,           // Return updated document (not original)
                runValidators: true  // Run model validators on update
            }
        );
        
        if (!productToUpdate) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({
            message: "Product updated successfully",
            product: productToUpdate
        });
    } catch (error) {
        console.error("Error updating product:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * DELETE PRODUCT - Remove a product from the database
 * Purpose: Remove products from inventory
 * Features: Authentication required
 * Access: Protected (requires valid API key)
 * URL Parameter: id - MongoDB ObjectId of the product to delete
 */
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ 
            message: "Product deleted successfully",
            deletedProduct: deletedProduct  // Return deleted product for confirmation
        });
    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Export the router to be used in server.js
module.exports = router;