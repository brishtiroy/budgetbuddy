const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('1. Register hit, body:', req.body);
    
    const { name, email, password, mode } = req.body;
    
    console.log('2. Checking if email exists...');
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    
    console.log('3. Creating user...');
    const user = new User({ name, email, password, mode });
    
    console.log('4. Saving user...');
    await user.save();
    
    console.log('5. Creating token...');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('6. Sending response...');
    res.json({ token, user: { id: user._id, name, email, mode } });
    
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    console.error('FULL ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, mode: user.mode, coupleId: user.coupleId }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;