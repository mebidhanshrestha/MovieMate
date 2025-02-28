const express = require('express');
const Room = require('../models/Room');

const router = express.Router();

// Get seats for a specific showtime
router.get('/:roomId/showtimes/:showtimeId/seats', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const showtime = room.showtimes.id(req.params.showtimeId);
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    res.json(showtime.seats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Book a seat for a specific showtime
router.post('/:roomId/showtimes/:showtimeId/book', async (req, res) => {
  const { seat_number } = req.body;

  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const showtime = room.showtimes.id(req.params.showtimeId);
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    const seat = showtime.seats.find((s) => s.seat_number === seat_number);
    if (!seat) return res.status(404).json({ message: 'Seat not found' });

    if (seat.status === 'booked') {
      return res.status(400).json({ message: 'Seat already booked' });
    }

    seat.status = 'booked';
    await room.save();
    
    res.json({ message: 'Seat booked successfully', seat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
