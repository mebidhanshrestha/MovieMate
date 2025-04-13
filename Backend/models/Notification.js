const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['payment', 'booking', 'system', 'other'],
    default: 'other'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  details: {
    // Only essential fields required for notification display
    amount: Number,
    movie_title: String,
    
    // Optional fields that can be used for additional context but won't be displayed
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    payment_method: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);