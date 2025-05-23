// Simplified auth middleware for testing
module.exports.authenticate = (req, res, next) => {
  // For testing purposes, we'll just pass through without authentication
  // In a real application, you would implement proper authentication here
  req.user = { _id: '123456789012', username: 'testuser' };
  next();
};

module.exports.isAdmin = (req, res, next) => {
  // For testing purposes, we'll just pass through
  next();
};