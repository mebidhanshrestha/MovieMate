const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();
const User = require('../models/User');

// Create a Gmail transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Helps with some Gmail connection issues
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: "user" });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role: user.role, id: user._id }); // Send role in response
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate OTP and send it via email for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 600000; // 10 minutes
    
    await user.save();
    
    try {
      // Send email with OTP
      const mailOptions = {
        from: `"MovieMate" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP for MovieMate',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>We received a request to reset your password for your MovieMate account.</p>
            <p>Your One-Time Password (OTP) is: <strong style="font-size: 18px; color: #007bff;">${otp}</strong></p>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Regards,<br>MovieMate Team</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log("Password reset email sent to:", email);
      
      res.json({ 
        message: 'OTP has been sent to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // For development only - return OTP if email fails
      res.status(200).json({
        message: 'Email sending failed but OTP was generated',
        otp: otp // REMOVE THIS IN PRODUCTION!
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Find user with valid OTP
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    
    await user.save();
    
    try {
      // Send confirmation email
      const mailOptions = {
        from: `"MovieMate" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Password Has Been Reset - MovieMate',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact our support team immediately.</p>
            <p>Regards,<br>MovieMate Team</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Continue with the response even if confirmation email fails
    }
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this new route to your userRoutes.js file

// Verify OTP without resetting password
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find user with valid OTP
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Invalid or expired OTP' 
      });
    }
    
    // OTP is valid
    res.json({ 
      valid: true, 
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;