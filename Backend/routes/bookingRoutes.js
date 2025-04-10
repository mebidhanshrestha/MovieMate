const express = require('express');
const router = express.Router();
const { 
  getAllBookings, 
  getBookingById, 
  updateBookingStatus, 
  getBookingStats,
  getUserBookings
} = require('../controllers/bookingController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const { bookSeats } = require('../controllers/movieController');

// Routes that require admin privileges
router.get('/all', verifyAdmin, getAllBookings);
router.get('/stats/summary', verifyAdmin, getBookingStats);
router.get('/:id', verifyAdmin, getBookingById);
router.patch('/:id/status', verifyAdmin, updateBookingStatus);

// Routes for regular users
router.get('/user/my-bookings', verifyToken, getUserBookings);
router.post('/booking/movie-book', bookSeats );
module.exports = router;