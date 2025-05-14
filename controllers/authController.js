const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        accountType: user.accountType
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { username, password, accountType } = req.body;
    const user = new User({ username, password, accountType });
    await user.save();
    
    res.status(201).json({ 
      message: 'Account created',
      user: {
        id: user._id,
        username: user.username,
        accountType: user.accountType
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};