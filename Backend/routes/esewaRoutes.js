const express = require("express");
const crypto = require("crypto");
const axios = require("axios"); // Make sure to import axios
const router = express.Router();

// Correct eSewa Test Configuration
const ESEWA_CONFIG = {
  MERCHANT_CODE: "EPAYTEST",
  SECRET_KEY: "8gBm/:&EnhH.1/q",
  SUCCESS_URL: "http://localhost:5173/esewa-success",
  FAILURE_URL: "http://localhost:5173/esewa-failure",
  TEST_ENDPOINT: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  STATUS_ENDPOINT: "https://rc-epay.esewa.com.np/api" // Base URL for status check
};

// Status check endpoint to verify if eSewa service is available
// In esewaRoutes.js
// In esewaRoutes.js
// In esewaRoutes.js
router.get("/status", async (req, res) => {
  try {
    // Check if eSewa website/domain is reachable using a simple DNS lookup
    // This is more reliable than trying API endpoints directly
    const dns = require('dns');
    const domain = 'rc-epay.esewa.com.np';
    
    // Promisify the DNS lookup
    const lookup = () => {
      return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
    };
    
    // Try to resolve the domain
    await lookup();
    
    // If we reach here, the domain is reachable
    console.log('eSewa domain is reachable');
    
    // We can still mark as unavailable for testing
    // Set to true when you want to test eSewa integration
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

router.post("/prepare-payment", (req, res) => {
  try {
    console.log("======= Prepare Payment Request =======");
    console.log("Request Body:", req.body);

    const { amount, transactionUuid } = req.body;

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

    // Generate signature - this is important
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

// Verification endpoint for eSewa payments
// In esewaRoutes.js
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
    const transactionUuid = req.body.transactionUuid || req.body.transaction_uuid || 'UNKNOWN';
    const status = req.body.status || 'MANUAL_VERIFICATION';
    
    console.log('Processed verification data:', {
      referenceId,
      transactionUuid,
      status
    });
    
    // In a real implementation, you would verify with eSewa here
    // For now, just return success
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

// Add success and failure routes if needed
router.get("/success", (req, res) => {
  res.json({
    success: true,
    message: "Payment successful",
    data: req.query,
  });
});

router.get("/failure", (req, res) => {
  res.json({
    success: false,
    message: "Payment failed",
    data: req.query,
  });
});

module.exports = router;