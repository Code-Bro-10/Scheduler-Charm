const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee'); // We'll use Employee model for authentication

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_scheduler_key_123';

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // In a real app, you would check the password against a hashed password in DB
    // For this demonstration, we are just verifying the email exists and matches the role
    const user = await Employee.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. You are not an ${role}.` });
    }

    // Dummy password check (in reality, use bcrypt.compare)
    if (password !== 'password123') { // hardcoded for demo unless you add password field to schema
      // To make it easy for the user right now, we will bypass password check 
      // or we can just accept any password for the demo.
      // return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
