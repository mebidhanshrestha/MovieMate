const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Menu = require('../models/Menu');

// Get user's complete purchase history
const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch all booking records for the user
    const bookings = await Booking.find({ user_id: userId })
      .populate('movie_id', 'title description duration image type')
      .populate('menu_items.menu_id', 'name price image') // Populate menu items
      .sort({ date: -1 })
      .lean();
    
    console.log('Found bookings:', bookings);
    
    // Transform bookings for movie tickets view
    const movieTickets = bookings.map(booking => ({
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id,
      menu_items: booking.menu_items || [],
      date: booking.date,
      time: booking.time_slot || '',
      payment_method: booking.payment_method || 'card',
      total_amount: booking.total_price || 0
    }));
    
    // Find bookings with menu items for concessions view
    const concessionsBookings = bookings.filter(booking => 
      booking.menu_items && booking.menu_items.length > 0
    );
    
    console.log('Bookings with concessions:', concessionsBookings);
    
    // Format concessions
    const concessions = concessionsBookings.map(booking => ({
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id, // Keep movie reference if available
      menu_items: booking.menu_items,
      date: booking.date,
      time: booking.time_slot || '',
      payment_method: booking.payment_method || 'card',
      total_amount: booking.total_price || 0
    }));
    
    // Structure the response
    const history = {
      movieTickets,
      concessions
    };
    
    res.status(200).json({
      success: true,
      history
    });
    
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get detailed information for a specific booking
const getSalesDetails = async (req, res) => {
  try {
    const { salesId } = req.params;
    
    const booking = await Booking.findById(salesId)
      .populate('movie_id')
      .lean();
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Format booking to match expected sale format
    // Include menu items if they exist in the booking
    const sale = {
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id,
      menu_items: booking.menu_items || [],
      date: booking.date,
      time: booking.time_slot || '',
      payment_method: booking.payment_method || 'card',
      total_amount: booking.total_price || 0,
      concessionsTotal: 0 // Calculate if you have menu items
    };
    
    res.status(200).json({
      success: true,
      sale
    });
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get movie ticket purchase history
const getMovieHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch all movie ticket purchases for the user
    const bookings = await Booking.find({ 
      user_id: userId
    })
      .populate('movie_id', 'title description duration image type')
      .sort({ date: -1 })
      .lean();
    
    // Convert to expected format
    const movieTickets = bookings.map(booking => ({
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id,
      menu_items: booking.menu_items || [],
      date: booking.date,
      time: booking.time_slot || '',
      payment_method: booking.payment_method || 'card',
      total_amount: booking.total_price || 0
    }));
    
    res.status(200).json({
      success: true,
      movieTickets
    });
    
  } catch (error) {
    console.error('Error fetching movie history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get concession purchase history
const getConcessionsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For now, this will be empty until you implement menu items in bookings
    // or create a separate collection for food orders
    const concessions = [];
    
    res.status(200).json({
      success: true,
      concessions
    });
    
  } catch (error) {
    console.error('Error fetching concessions history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserHistory,
  getSalesDetails,
  getMovieHistory,
  getConcessionsHistory
};