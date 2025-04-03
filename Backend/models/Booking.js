const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  movie_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Movie' 
  },
  room_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room' 
  },
  date: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  time_slot: String,
  seats: [String],
  menu_items: [{
    menu_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Menu',
      required: true 
    },
    quantity: { 
      type: Number, 
      default: 1,
      min: 1 

    }
  }],
  total_price: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  payment_method: { 
    type: String, 
    default: 'card' 
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled'], 
    default: 'confirmed' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);