// controllers/loyaltyPointController.js
const LoyaltyPoints = require('../models/LoyaltyPoints');

// GET - Get loyalty points for a user
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const loyaltyPoints = await LoyaltyPoints.findOne({ user_id: userId });
    
    if (!loyaltyPoints) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loyalty points not found for this user' 
      });
    }
    
    return res.status(200).json({
      success: true,
      data: loyaltyPoints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// POST - Create loyalty points for a user
exports.createLoyaltyPoints = async (req, res) => {
  try {
    const { user_id, points } = req.body;
    
    const loyaltyPoints = await LoyaltyPoints.create({
      user_id,
      points: points || 0
    });
    
    return res.status(201).json({
      success: true,
      data: loyaltyPoints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// PUT - Update loyalty points for a user
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { points } = req.body;
    
    const loyaltyPoints = await LoyaltyPoints.findOneAndUpdate(
      { user_id: userId },
      { points },
      { new: true, runValidators: true }
    );
    
    if (!loyaltyPoints) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty points not found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: loyaltyPoints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};