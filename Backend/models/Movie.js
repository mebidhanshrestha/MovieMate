const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: { type: String, enum: ["hosting", "expired"], required: true },
  type: { type: String, enum: ["upcoming", "current"], required: true },
  image: { type: String }, // URL for movie image
  price: { type: Number, default: 0, min: 0 } // Added price field with default 0
}, { timestamps: true });

module.exports = mongoose.model("Movie", movieSchema);