

// Validation middleware for product creation and updates
const validateProduct = (req, res, next) => {
    const { name, description, price, category, inStock } = req.body;
    const errors = [];

    // Validation rules
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        errors.push('Description is required and must be a non-empty string');
    }

    if (price === undefined || price === null) {
        errors.push('Price is required');
    } else if (typeof price !== 'number' || price < 0) {
        errors.push('Price must be a positive number');
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push('Category is required and must be a non-empty string');
    }

    if (inStock !== undefined && typeof inStock !== 'boolean') {
        errors.push('inStock must be a boolean value');
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors
        });
    }

    // Trim string fields
    if (name) req.body.name = name.trim();
    if (description) req.body.description = description.trim();
    if (category) req.body.category = category.trim();

    // Validation passed, continue to next middleware
    next();
};

module.exports = validateProduct;