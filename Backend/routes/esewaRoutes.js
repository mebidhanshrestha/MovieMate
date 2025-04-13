const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const router = express.Router();
const Notification = require('../models/Notification');
const Movie = require('../models/Movie');

// eSewa Configuration
const ESEWA_CONFIG = {
  MERCHANT_CODE: "EPAYTEST",
  SECRET_KEY: "8gBm/:&EnhH.1/q",
  SUCCESS_URL: "http://localhost:5173/esewa-success",
  FAILURE_URL: "http://localhost:5173/esewa-failure",
  TEST_ENDPOINT: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  STATUS_ENDPOINT: "https://rc-epay.esewa.com.np/api"
};

// Check if eSewa service is available
router.get("/status", async (req, res) => {
  try {
    // Check if eSewa domain is reachable using DNS lookup
    const dns = require('dns');
    const domain = 'rc-epay.esewa.com.np';
    
    // Promisify DNS lookup
    const lookup = () => {
      return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
    };
    
    await lookup();
    console.log('eSewa domain is reachable');
    
    // Option to force unavailable for testing
    const forceUnavailable = false;
    
    res.json({ 
      available: !forceUnavailable,
      message: forceUnavailable ? 'eSewa test environment is currently disabled.' : 'eSewa service is available.'
    });
  } catch (error) {
    console.log('eSewa service check failed:', error.message);
    res.json({ 
      available: false,
      message: 'eSewa service is currently unavailable'
    });
  }
});

// Prepare payment data for eSewa
router.post("/prepare-payment", (req, res) => {
  try {
    console.log("======= Prepare Payment Request =======");
    console.log("Request Body:", req.body);

    const { amount, transactionUuid, movieId, movieTitle } = req.body;

    // Validation
    if (!amount || !transactionUuid) {
      return res.status(400).json({
        error_message: "Amount and Transaction UUID are required",
        code: 400,
      });
    }

    // Format amount properly (ensure it's a valid number with 2 decimal places)
    const formattedAmount = parseFloat(amount).toFixed(2);

    if (isNaN(formattedAmount)) {
      return res.status(400).json({
        error_message: "Invalid amount format",
        code: 400,
      });
    }

    // Prepare payment data according to eSewa API v2 specifications
    const paymentData = {
      amount: formattedAmount,
      tax_amount: "0.00",
      total_amount: formattedAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.MERCHANT_CODE,
      product_service_charge: "0.00",
      product_delivery_charge: "0.00",
      success_url: ESEWA_CONFIG.SUCCESS_URL,
      failure_url: ESEWA_CONFIG.FAILURE_URL,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "",
    };

    // Generate signature for eSewa
    const dataToSign = `total_amount=${paymentData.total_amount},transaction_uuid=${paymentData.transaction_uuid},product_code=${paymentData.product_code}`;
    const hmac = crypto.createHmac("sha256", ESEWA_CONFIG.SECRET_KEY);
    hmac.update(dataToSign);
    paymentData.signature = hmac.digest("base64");

    console.log("Prepared Payment Data:", paymentData);
    console.log("===================================");

    res.json(paymentData);
  } catch (error) {
    console.error("Payment Preparation Error:", error);
    res.status(500).json({
      error_message: "Server error occurred",
      code: 500,
    });
  }
});

// Verify eSewa payment
router.post("/verify-payment", async (req, res) => {
  try {
    // Log all received data for debugging
    console.log('Payment Verification Full Request:', {
      body: req.body,
      query: req.query,
      headers: req.headers
    });
    
    // Extract data with fallbacks
    const referenceId = req.body.referenceId || req.body.refId || req.query.refId || 'MANUAL';
const transactionUuid = req.body.transactionUuid || req.body.transaction_uuid || req.query.transaction_uuid || 'UNKNOWN';
    const status = req.body.status || 'MANUAL_VERIFICATION';
    const amount = req.body.amount || req.body.total_amount || req.query.amt || '0';
    const movieId = req.body.movieId || req.body.movie_id || null;
    
    console.log('Processed verification data:', {
      referenceId,
      transactionUuid,
      status,
      amount,
      movieId
    });
    
    // Create a simple notification for admin with only amount and movie title
    try {
      // Get movie title if movieId is provided
      let movieTitle = 'Unknown Movie';
      
      if (movieId) {
        try {
          const movie = await Movie.findById(movieId);
          if (movie && movie.title) {
            movieTitle = movie.title;
          }
        } catch (movieError) {
          console.error('Error fetching movie details for notification:', movieError);
        }
      }
      
      // Create notification directly in database
      const notification = new Notification({
        type: 'payment',
        message: `Payment received, Rs.${amount} received for ${movieTitle}`,
        read: false,
        details: {
          amount: parseFloat(amount),
          movie_title: movieTitle
        }
      });
      
      await notification.save();
      console.log('Payment verification notification created:', notification._id);
    } catch (notificationError) {
      console.error('Error creating payment verification notification:', notificationError);
      // Continue with verification even if notification fails
    }
    
    // Return success response
    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      data: {
        referenceId,
        transactionUuid,
        verificationTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Success route - when eSewa redirects after successful payment
router.get("/success", async (req, res) => {
  const { oid, amt, refId } = req.query;
  
  console.log("eSewa Success Route:", {
    oid, amt, refId, 
    allParams: req.query
  });
  
  // Create notification for successful payment
  try {
    // Create notification with only amount and movie title
    const notification = new Notification({
      type: 'payment',
      message: `Payment received, Rs.${amt || 0} received for a movie booking`,
      read: false,
      details: {
        amount: parseFloat(amt || 0),
        movie_title: 'Movie booking'
      }
    });
    
    await notification.save();
    console.log('Success route notification created:', notification._id);
  } catch (notificationError) {
    console.error('Error creating success route notification:', notificationError);
  }
  
  res.json({
    success: true,
    message: "Payment successful",
    data: req.query,
  });
});

// Failure route - when eSewa redirects after failed payment
router.get("/failure", (req, res) => {
  console.log("eSewa Failure Route:", req.query);
  
  res.json({
    success: false,
    message: "Payment failed",
    data: req.query,
  });
});

// Simple endpoint for manual notification creation
router.post("/create-notification", async (req, res) => {
  try {
    const { amount, movieTitle } = req.body;
    
    if (!amount || !movieTitle) {
      return res.status(400).json({
        success: false,
        message: "Amount and movie title are required"
      });
    }
    
    // Create simple notification
    const notification = new Notification({
      type: 'payment',
      message: `Payment received, Rs.${amount} received for ${movieTitle}`,
      read: false,
      details: {
        amount: parseFloat(amount),
        movie_title: movieTitle
      }
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: notification._id
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message
    });
  }
});

module.exports = router;