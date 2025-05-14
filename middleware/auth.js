const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.user?.accountType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};