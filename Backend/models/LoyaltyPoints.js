// models/LoyaltyPoints.js
const mongoose = require('mongoose');

const loyaltyPointsSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  points: { 
    type: Number, 
    default: 0,
    min: 0 
  },
});


module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);