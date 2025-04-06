const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Menu = require('../models/Menu');

const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ user_id: userId })
      .populate('movie_id', 'title description duration image type')
      .populate('room_id', 'name total_seats') // Add room population
      .populate({
        path: 'menu_items.menu_id', 
        select: 'name price image', 
        model: 'Menu'
      })
      .sort({ date: -1 })
      .lean();

    console.log('Raw Fetched Bookings:', JSON.stringify(bookings, null, 2));

    // Defensive handling of bookings and menu items
    const processedBookings = bookings.map(booking => {
      // Ensure menu_items is an array, even if undefined
      const safeMenuItems = Array.isArray(booking.menu_items) 
        ? booking.menu_items 
        : [];

      // Process menu items with fallback values
      const processedMenuItems = safeMenuItems.map(item => {
        // Ensure menu_id exists and has properties
        const menuId = item.menu_id || {};
        return {
          menu_id: {
            _id: menuId._id || 'unknown',
            name: menuId.name || 'Unknown Item',
            price: menuId.price || 0,
            image: menuId.image || '/placeholder-food.jpg'
          },
          quantity: item.quantity || 0
        };
      });

      return {
        ...booking,
        date: booking.date || new Date(), // Fallback to current date if null
        menu_items: processedMenuItems,
        // Ensure seats is always an array
        seats: Array.isArray(booking.seats) ? booking.seats : []
      };
    });

    // Separate movie tickets and concessions with additional safety checks
    const movieTickets = processedBookings
      .filter(booking => booking.movie_id)
      .map(booking => ({
        _id: booking._id,
        user_id: booking.user_id,
        movie_id: booking.movie_id,
        room_id: booking.room_id, // Include room information
        seats: booking.seats, // Include seat information
        menu_items: booking.menu_items || [],
        date: booking.date,
        time: booking.time_slot || '',
        payment_method: booking.payment_method || 'card',
        total_amount: booking.total_price || 0
      }));

    const concessions = processedBookings
      .filter(booking => 
        booking.menu_items && booking.menu_items.length > 0
      )
      .map(booking => ({
        _id: booking._id,
        user_id: booking.user_id,
        movie_id: booking.movie_id,
        room_id: booking.room_id, // Include room information
        seats: booking.seats, // Include seat information
        menu_items: booking.menu_items,
        date: booking.date,
        time: booking.time_slot || '',
        payment_method: booking.payment_method || 'card',
        total_amount: booking.total_price || 0
      }));

    console.log('Processed Movie Tickets:', JSON.stringify(movieTickets, null, 2));
    console.log('Processed Concessions:', JSON.stringify(concessions, null, 2));

    const history = {
      movieTickets,
      concessions
    };

    res.status(200).json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Detailed Error in getUserHistory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.toString() 
    });
  }
};

// Update getSalesDetails to match the same population logic
const getSalesDetails = async (req, res) => {
  try {
    const { salesId } = req.params;
    
    const booking = await Booking.findById(salesId)
      .populate('movie_id')
      .populate('room_id', 'name total_seats') // Add room population
      .populate({
        path: 'menu_items.menu_id', 
        select: 'name price image', 
        model: 'Menu'
      })
      .lean();
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Format booking to match expected sale format
    const sale = {
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id,
      room_id: booking.room_id, // Include room information
      seats: Array.isArray(booking.seats) ? booking.seats : [], // Include seat information
      menu_items: (booking.menu_items || []).map(item => ({
        menu_id: {
          _id: item.menu_id?._id || 'unknown',
          name: item.menu_id?.name || 'Unknown Item',
          price: item.menu_id?.price || 0,
          image: item.menu_id?.image || '/placeholder-food.jpg'
        },
        quantity: item.quantity || 0
      })),
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
      .populate('room_id', 'name total_seats') // Add room population
      .sort({ date: -1 })
      .lean();
    
    // Convert to expected format
    const movieTickets = bookings.map(booking => ({
      _id: booking._id,
      user_id: booking.user_id,
      username: '',
      movie_id: booking.movie_id,
      room_id: booking.room_id, // Include room information
      seats: Array.isArray(booking.seats) ? booking.seats : [], // Include seat information
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