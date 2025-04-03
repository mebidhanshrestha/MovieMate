const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization'); // Get token from header
    if (!token) return res.status(401).json({ message: 'Unauthorized - No token provided' });

    // Remove 'Bearer ' prefix if it exists
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify the token
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    
    // Attach the decoded user info to the request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

module.exports = { verifyAdmin, verifyToken };