const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.Access;
        console.log(token);
        if (!token) {
            console.error('No token provided');
            next();
        } else {
            const decoded = jwt.verify(token, "1234567");
            req.user = decoded;
            next();
        }
    } catch (err) {
        console.error('Invalid token:', err.message);
    }
};

module.exports = authMiddleware;