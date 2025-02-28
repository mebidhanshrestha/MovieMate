const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  date: Date,
  time_slot: String,
  seats: [String],
  total_price: Number,
  payment_method: String,
  status: { type: String, enum: ['confirmed', 'cancelled'] }
});
module.exports = mongoose.model('Booking', bookingSchema);