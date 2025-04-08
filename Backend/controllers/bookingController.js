const Booking = require('../models/Booking');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Room = require('../models/Room');
const Menu = require('../models/Menu');

// In your bookingController.js
exports.getAllBookings = async (req, res) => {
  try {
    // Get all bookings sorted by date (newest first)
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'user_id',
        select: 'name email' // Explicitly select name and email
      })
      .populate({
        path: 'movie_id',
        select: 'title' // Explicitly select movie title
      })
      .populate({
        path: 'room_id',
        select: 'name' // Explicitly select room name
      })
      .populate({
        path: 'menu_items.menu_id',
        select: 'name price weight calories image' // Select menu item details
      });
    
    // Transform bookings to ensure all data is present
    const transformedBookings = bookings.map(booking => ({
      ...booking.toObject(), // Convert Mongoose document to plain object
      userData: booking.user_id 
        ? { 
            name: booking.user_id.name || 'Unknown', 
            email: booking.user_id.email || 'N/A' 
          } 
        : { name: 'Unknown', email: 'N/A' },
      movieData: booking.movie_id 
        ? { title: booking.movie_id.title || 'Unknown Movie' } 
        : { title: 'Unknown Movie' },
      roomData: booking.room_id 
        ? { name: booking.room_id.name || 'Unknown Room' } 
        : { name: 'Unknown Room' },
      menu_items: booking.menu_items.map(item => ({
        ...item.toObject(),
        menuDetails: item.menu_id 
          ? {
              name: item.menu_id.name,
              price: item.menu_id.price,
              weight: item.menu_id.weight,
              calories: item.menu_id.calories,
              image: item.menu_id.image
            }
          : null
      }))
    }));
    
    res.status(200).json({ 
      success: true, 
      bookings: transformedBookings 
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings', 
      error: error.message 
    });
  }
};

// Get booking by ID with details
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user_id', 'name email')
      .populate('movie_id', 'title image')
      .populate('room_id', 'name')
      .populate('menu_items.menu_id');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Get the room and showtime details
    const room = await Room.findById(booking.room_id);
    let showtime = null;
    
    if (room && room.showtimes) {
      showtime = room.showtimes.find(
        s => s._id.toString() === booking.time_slot
      );
    }
    
    res.status(200).json({ 
      success: true, 
      booking,
      showtime
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking details', 
      error: error.message 
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value. Must be "confirmed" or "cancelled"' 
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // If status is already the requested status, no need to update
    if (booking.status === status) {
      return res.status(200).json({
        success: true,
        message: `Booking status is already ${status}`,
        booking
      });
    }
    
    // Update the status
    booking.status = status;
    await booking.save();
    
    // If cancelling, update seat status in the room
    if (status === 'cancelled') {
      try {
        const room = await Room.findById(booking.room_id);
        if (room) {
          const showtimeIndex = room.showtimes.findIndex(
            s => s._id.toString() === booking.time_slot
          );
          
          if (showtimeIndex !== -1) {
            const showtime = room.showtimes[showtimeIndex];
            
            // Update seat status back to available
            booking.seats.forEach(seatNumber => {
              const seatIndex = showtime.seats.findIndex(
                s => s.seat_number === seatNumber
              );
              
              if (seatIndex !== -1) {
                showtime.seats[seatIndex].status = 'available';
              }
            });
            
            await room.save();
          }
        }
      } catch (error) {
        console.error('Error updating seats after cancellation:', error);
        // Continue anyway, the booking was cancelled successfully
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update booking status', 
      error: error.message 
    });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    // Count total bookings
    const totalBookings = await Booking.countDocuments();
    
    // Count confirmed bookings
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    
    // Count cancelled bookings
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
    // Calculate total revenue (for confirmed bookings only)
    const bookings = await Booking.find({ status: 'confirmed' });
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
    
    // Get most popular movie
    const movieStats = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$movie_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let popularMovie = null;
    if (movieStats.length > 0) {
      popularMovie = await Movie.findById(movieStats[0]._id, 'title');
    }
    
    // Get most popular food items
    const menuStats = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $unwind: '$menu_items' },
      { $group: { _id: '$menu_items.menu_id', totalQuantity: { $sum: '$menu_items.quantity' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    const popularMenuItems = await Promise.all(
      menuStats.map(async (item) => {
        const menuItem = await Menu.findById(item._id, 'name');
        return {
          name: menuItem ? menuItem.name : 'Unknown Item',
          quantity: item.totalQuantity
        };
      })
    );
    
    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        popularMovie: popularMovie ? popularMovie.title : null,
        popularMenuItems
      }
    });
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking statistics', 
      error: error.message 
    });
  }
};

// Get user bookings (for regular users)
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the token payload
    
    const bookings = await Booking.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate('movie_id', 'title image')
      .populate('room_id', 'name')
      .populate('menu_items.menu_id');
    
    res.status(200).json({ 
      success: true, 
      bookings 
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings', 
      error: error.message 
    });
  }
};