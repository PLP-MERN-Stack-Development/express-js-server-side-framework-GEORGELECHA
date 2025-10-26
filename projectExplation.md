## A complete RESTful API for managing products built with Express.js, MongoDB, and modern middleware.

## Setup Instructions
 ## 1:Clone and install
 git clone <repository-url>
cd express-js-server-side-framework-GEORGELECHA
npm install


## 2: Environment setup

process.env.

## Start the server
npm start

Server runs on http://localhost:3000 by default.


## API Endpoints

Base URL: http://localhost:3000/api

# 🔐 Authentication
Protected routes require API key in header:

curl -H "x-api-key: secret-key" http://localhost:3000/api/products

## 📦 Products
GET /products
Get all products with filtering, pagination, and sorting.

Query Parameters:

1. category - Filter by category (electronics, kitchen, clothing)

2. inStock - Filter by stock status (true/false)

3. minPrice/maxPrice - Price range filtering

4. page - Page number (default: 1)

5. limit - Items per page (default: 10)

6. sort - Sort field (-price for descending)

7. fields - Select specific fields (name,price,category)


## example:
curl "http://localhost:3000/api/products?category=electronics&page=1&limit=5"

response:
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalProducts": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "category": "electronics"
  },
  "count": 5,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "iPhone 15 Pro",
      "description": "Latest smartphone",
      "price": 999,
      "category": "electronics",
      "inStock": true
    }
  ]
}

-- GET /products/search
Search products by name, description, or category.

Parameters:

q - Search term (required)

page - Page number

limit - Items per page

## Example:
curl "http://localhost:3000/api/products/search?q=phone&limit=3"

## response:
{
  "search": {
    "query": "phone",
    "totalResults": 8,
    "currentPage": 1,
    "totalPages": 3,
    "hasNext": true
  },
  "results": 3,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "iPhone 15 Pro",
      "price": 999,
      "category": "electronics"
    }
  ]
}



---- GET /products/stats
Get product analytics and statistics.

Example:
curl "http://localhost:3000/api/products/stats"

response:
{
  "summary": {
    "totalProducts": 25,
    "inStock": 18,
    "outOfStock": 7,
    "inStockPercentage": "72.00"
  },
  "priceStatistics": {
    "averagePrice": 245.67,
    "minPrice": 17,
    "maxPrice": 2499
  },
  "categories": [
    {
      "category": "electronics",
      "count": 8,
      "averagePrice": 456.25
    }
  ]
}




----- GET /products/:id
Get a specific product by ID.

Example: curl "http://localhost:3000/api/products/507f1f77bcf86cd799439011"


response:
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "iPhone 15 Pro",
  "description": "Latest smartphone with advanced camera",
  "price": 999,
  "category": "electronics",
  "inStock": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}


## --------POST /products
Create a new product (Protected).

Request:
{
  "name": "MacBook Pro",
  "description": "Professional laptop",
  "price": 1999,
  "category": "electronics",
  "inStock": true
}

Response: 
{
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "MacBook Pro",
    "description": "Professional laptop",
    "price": 1999,
    "category": "electronics",
    "inStock": true
  }
}

## --------PUT /products/:id
Update a product (Protected).

Request:
{
  "price": 1799,
  "inStock": false
}

response:

{
  "message": "Product updated successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "iPhone 15 Pro",
    "price": 1799,
    "inStock": false
  }
}

## -------DELETE /products/:id
Delete a product (Protected).

Response:
{
  "message": "Product deleted successfully",
  "deletedProduct": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "iPhone 15 Pro"
  }
}



## ------Health Check
GET /health
Check API status.

Response:
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "Product API"
}


## --- Error Responses
400 Validation Error:


{
  "message": "Validation failed",
}