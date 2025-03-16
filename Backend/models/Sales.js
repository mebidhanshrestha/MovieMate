  const mongoose = require('mongoose');

  const salesSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    menu_items: [
      {
        menu_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
        quantity: Number
      }
    ],
    date: Date,
    time: String,
    payment_method: String,
    total_amount: Number
  });
  module.exports = mongoose.model('Sales', salesSchema);