// arogya-mcvk/backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// Ensure .env is loaded. This is often done in server.js, but can be here for safety.
require('dotenv').config({ path: __dirname + '/../.env' }); 

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Token expiration time

// Function to generate JWT
const generateToken = (id, role) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined. Cannot generate token.');
  }
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// @route   POST api/auth/register
// @desc    Register a new user. 
//          For initial admin setup, send "role": "admin" in the request body.
//          Consider protecting this route further in a production environment if public registration is not desired.
// @access  Public (for now)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists with this email.' }] });
    }

    // Create new user instance
    // The role can be optionally passed; otherwise, it defaults to 'user' as per schema.
    user = new User({
      name,
      email,
      password,
      role: (role && ['admin', 'user'].includes(role)) ? role : 'user', // Assign role from request if valid, else default
    });

    // Password hashing is handled by the pre-save hook in UserSchema
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: { // Send back non-sensitive user info
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      msg: 'User registered successfully.'
    });

  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ errors: messages.map(msg => ({ msg })) });
    }
    if (err.message.includes('JWT_SECRET is not defined')) {
        return res.status(500).json({ errors: [{ msg: 'Server configuration error for token generation.' }] });
    }
    res.status(500).send('Server Error during registration.');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email or password is provided
    if (!email || !password) {
        return res.status(400).json({ errors: [{ msg: 'Please provide both email and password.' }] });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password for comparison
    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Invalid credentials. User not found.' }] }); // 401 for auth failure
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ errors: [{ msg: 'Invalid credentials. Password incorrect.' }] }); // 401 for auth failure
    }

    // User matched, create and send token
    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: { // Send back non-sensitive user info
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      msg: 'Logged in successfully.'
    });

  } catch (err) {
    console.error('Login error:', err.message);
    if (err.message.includes('JWT_SECRET is not defined')) {
        return res.status(500).json({ errors: [{ msg: 'Server configuration error for token generation.' }] });
    }
    res.status(500).send('Server Error during login.');
  }
});

module.exports = router;