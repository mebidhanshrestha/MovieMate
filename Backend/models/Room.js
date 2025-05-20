const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seat_number: { type: String, required: true },
  status: { type: String, enum: ["available", "booked"], default: "available" },
});

const showtimeSchema = new mongoose.Schema({
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  seats: [seatSchema], // Array of seats for this showtime
});

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  total_seats: { type: Number, default: 50 },
  showtimes: [showtimeSchema], // Array of showtimes for this room
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);