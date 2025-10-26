// Authentication middleware that checks for API key
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    
    // Check if API key exists and is valid
    if (!apiKey) {
        return res.status(401).json({ 
            message: 'Access denied. No API key provided.' 
        });
    }
    
    // In a real application, you would validate against a database
    // For this example, we'll use a simple check against environment variable
    const validApiKey = process.env.API_KEY || 'default-secret-key-123';
    
    if (apiKey !== validApiKey) {
        return res.status(403).json({ 
            message: 'Invalid API key.' 
        });
    }
    
    // API key is valid, continue to next middleware
    next();
};

module.exports = authenticate;