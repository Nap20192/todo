const session = require('express-session')
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        console.error('No token provided');
        return res.redirect('/auth'); 
    }
    try {
        const decoded = jwt.verify(token, "1234567");
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Invalid token:', err.message);
        res.redirect('/auth'); 
    }
    
};

module.exports = authMiddleware;