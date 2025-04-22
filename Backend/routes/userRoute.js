const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const router = express.Router();
const User = require("../models/User");
const path = require("path");
const ejs = require("ejs");

// Create a Gmail transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Helps with some Gmail connection issues
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// User registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role, id: user._id }); // Send role in response
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate OTP and send it via email for password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
        subject: "Password Reset OTP for MovieMate",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name || "User"},</p>
            <p>We received a request to reset your password for your MovieMate account.</p>
            <p>Your One-Time Password (OTP) is: <strong style="font-size: 18px; color: #007bff;">${otp}</strong></p>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Regards,<br>MovieMate Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Password reset email sent to:", email);

      res.json({
        message: "OTP has been sent to your email",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);

      // For development only - return OTP if email fails
      res.status(200).json({
        message: "Email sending failed but OTP was generated",
        otp: otp, // REMOVE THIS IN PRODUCTION!
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP and reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
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
        subject: "Your Password Has Been Reset - MovieMate",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Hello ${user.name || "User"},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact our support team immediately.</p>
            <p>Regards,<br>MovieMate Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Confirmation email error:", emailError);
      // Continue with the response even if confirmation email fails
    }

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add this new route to your userRoutes.js file

// Verify OTP without resetting password
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: "Invalid or expired OTP",
      });
    }

    // OTP is valid
    res.json({
      valid: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      valid: false,
      message: "Server error",
    });
  }
});

// Replace this block in your userRoutes.js file
router.post("/send-ticket-receipt", async (req, res) => {
  try {
    console.log("Receipt email endpoint called");
    const { userEmail, userName, receipt } = req.body;

    console.log("Email data:", { userEmail, userName, hasReceipt: !!receipt });

    if (!userEmail || !receipt) {
      return res.status(400).json({
        success: false,
        message: "Email and receipt data are required",
      });
    }

    // Format date for better display
    const formatDateString = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        console.error("Date formatting error:", error);
        return dateStr || "Not specified";
      }
    };

    // Create a more detailed HTML email
    const detailedHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #e3b400; text-align: center; margin-bottom: 20px;">Your MovieMate Booking</h2>
        
        <p>Hello ${userName || "Valued Customer"},</p>
        <p>Thank you for your booking with MovieMate. Below are your ticket details:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Movie Details</h3>
          <p><strong>Movie:</strong> ${receipt.movieTitle}</p>
          <p><strong>Date:</strong> ${formatDateString(receipt.date)}</p>
          <p><strong>Time:</strong> ${receipt.time}</p>
          <p><strong>Room:</strong> ${receipt.room}</p>
          
          <h3 style="margin-top: 20px; color: #333;">Seat Information</h3>
          <p><strong>Selected Seats:</strong> ${receipt.seats.join(", ")}</p>
          
          <h3 style="margin-top: 20px; color: #333;">Booking Information</h3>
          <p><strong>Booking ID:</strong> #${receipt.bookingId}</p>
          <p><strong>Total Price:</strong> Rs. ${receipt.totalPrice.toFixed(
            2
          )}</p>
          
          ${
            receipt.loyaltyPointsEarned > 0
              ? `<p style="color: #28a745;"><strong>Loyalty Points Earned:</strong> +${receipt.loyaltyPointsEarned} points</p>`
              : ""
          }
        </div>
        
        ${
          receipt.menuItems && receipt.menuItems.length > 0
            ? `
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Food & Beverages</h3>
            <ul style="padding-left: 20px;">
              ${receipt.menuItems
                .map(
                  (item) =>
                    `<li>${item.quantity} x ${item.name || "Item"} - Rs. ${(
                      item.price * item.quantity
                    ).toFixed(2)}</li>`
                )
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        <p style="text-align: center; margin-top: 30px; color: #e3b400; font-weight: bold;">Thank you for choosing MovieMate!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} MovieMate. All rights reserved.</p>
        </div>
      </div>
    `;

    // Configure email
    const mailOptions = {
      from: `"MovieMate" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Your MovieMate Ticket for ${receipt.movieTitle}`,
      html: detailedHtml,
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully to:", userEmail);

      res.json({
        success: true,
        message: "Receipt has been sent to your email",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      res.status(500).json({
        success: false,
        message: "Error sending receipt email",
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error("Email receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing email receipt",
      error: error.message,
    });
  }
});

module.exports = router;
