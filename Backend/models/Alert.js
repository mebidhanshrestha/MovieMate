const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['banner', 'movie', 'system'],
    default: 'system'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  global: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days in seconds
  }
});

// Compound index to efficiently query by userId and read status
AlertSchema.index({ userId: 1, read: 1 });
// Index for global alerts
AlertSchema.index({ global: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', AlertSchema);