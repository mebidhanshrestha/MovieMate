const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: String,
  total_seats: { type: Number, default: 50 }
});
module.exports = mongoose.model('Room', roomSchema);