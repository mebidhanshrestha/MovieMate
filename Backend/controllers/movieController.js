const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Movie = require('../models/Movie');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to store images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File name with timestamp to avoid conflicts
  },
});

const upload = multer({ storage: storage });

// Add a movie to the database with image upload
const addMovie = async (req, res) => {
  try {
    const { title, description, duration, start_date, end_date, status, type, price } = req.body;

    if (!title || !duration || !start_date || !end_date || !status || !type || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const imageUrl = `/uploads/${req.file.filename}`; // Store file path
    const newMovie = new Movie({
      title,
      description,
      duration,
      start_date,
      end_date,
      status,
      type,
      image: imageUrl,
      price: price || 0 // Handle the price field
    });
    await newMovie.save();

    res.status(201).json({ message: "Movie added successfully", movie: newMovie });
  } catch (error) {
    console.error("Error adding movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to handle file upload for adding or updating a movie
const uploadMovie = upload.single('image'); // 'image' is the field name used in FormData

// Get all movies
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json({ movies });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single movie by ID
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    res.status(200).json({ movie });
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a movie
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, start_date, end_date, status, type, price } = req.body;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    // Update movie details
    movie.title = title || movie.title;
    movie.description = description || movie.description;
    movie.duration = duration || movie.duration;
    movie.start_date = start_date || movie.start_date;
    movie.end_date = end_date || movie.end_date;
    movie.status = status || movie.status;
    movie.type = type || movie.type;
    movie.price = price !== undefined ? price : movie.price; // Update price if provided
    
    // Update image if a new one is provided
    if (req.file) {
      // Remove old image if exists and it's not the default image
      if (movie.image && movie.image.startsWith('/uploads/')) {
        try {
          const oldImagePath = path.join(__dirname, '..', movie.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
          // Continue even if image deletion fails
        }
      }
      
      // Set new image path
      movie.image = `/uploads/${req.file.filename}`;
    }
    
    await movie.save();
    
    res.status(200).json({ message: "Movie updated successfully", movie });
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a movie
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    // Remove image file if exists
    if (movie.image && movie.image.startsWith('/uploads/')) {
      try {
        const imagePath = path.join(__dirname, '..', movie.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error("Error deleting image:", err);
        // Continue even if image deletion fails
      }
    }
    
    await Movie.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get showtimes for a specific movie
const getShowtimes = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Fetch rooms that have at least one showtime with the given movieId
    const rooms = await Room.find(
      { "showtimes.movie_id": movieId },
      "name showtimes"
    ).lean(); // Use .lean() for better performance

    // Filter showtimes for the specific movie
    const filteredRooms = rooms.map(room => ({
      ...room,
      showtimes: room.showtimes.filter(showtime => showtime.movie_id.toString() === movieId)
    }));

    res.status(200).json({ success: true, rooms: filteredRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get available seats for a specific showtime
const getAvailableSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const room = await Room.findOne({ "showtimes._id": showtimeId }, { "showtimes.$": 1 });
    if (!room) return res.status(404).json({ success: false, message: "Showtime not found" });
    res.status(200).json({ success: true, seats: room.showtimes[0].seats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Book seats for a movie
const bookSeats = async (req, res) => {
  try {
    const { 
      user_id, 
      movie_id, 
      room_id, 
      date = new Date(), // Default to current date if not provided
      time_slot, 
      seats, 
      menu_items = [], 
      payment_method = 'card', 
      total_price,
      transaction_id, // Add this to store eSewa transaction ID
      esewa_token   // Add this to store eSewa token
    } = req.body;

    // Ensure date is a valid Date object
    const bookingDate = date instanceof Date ? date : new Date(date);

    const room = await Room.findOne({ _id: room_id, "showtimes._id": time_slot });
    if (!room) return res.status(404).json({ success: false, message: "Room or Showtime not found" });

    const showtime = room.showtimes.id(time_slot);
    const unavailableSeats = showtime.seats.filter(s => seats.includes(s.seat_number) && s.status === "booked");
    if (unavailableSeats.length > 0) return res.status(400).json({ success: false, message: "Some seats are already booked" });

    showtime.seats.forEach(seat => {
      if (seats.includes(seat.seat_number)) seat.status = "booked";
    });
    await room.save();

    // Prepare menu items with proper references
    const preparedMenuItems = menu_items.map(item => ({
      menu_id: item.menu_id || item.id, // Handle different possible input formats
      quantity: item.quantity
    }));

    // Create booking with payment information
    const bookingData = { 
      user_id, 
      movie_id, 
      room_id, 
      date: bookingDate, 
      time_slot, 
      seats, 
      menu_items: preparedMenuItems,
      payment_method,
      total_price,
      status: "confirmed" ,
      transaction_id,
      esewa_token
    };

    // Add payment-specific fields based on payment method
    if (payment_method === 'esewa') {
      bookingData.transaction_id = transaction_id;
      bookingData.esewa_token = esewa_token;
      // In production, you would verify the eSewa token here
    }

    const booking = new Booking(bookingData);
    await booking.save();

    // Create simple notification with only movie title and amount
    try {
      // Get movie title for notification
      const movie = await Movie.findById(movie_id).select('title');
      const movieTitle = movie ? movie.title : 'Unknown Movie';
      
      // Create simplified notification with just the essential details
      const notification = new Notification({
        type: 'payment',
        message: `Payment received, Rs.${total_price} received for ${movieTitle}`,
        read: false,
        details: {
          amount: total_price,
          movie_title: movieTitle,
          // Include these but they won't be displayed in UI
          booking_id: booking._id,
          user_id: user_id,
          payment_method: payment_method
        }
      });
      
      await notification.save();
      console.log(`Admin notification created for payment: ${notification._id}`);
    } catch (notificationError) {
      // Log error but don't fail the booking process
      console.error("Error creating admin notification:", notificationError);
    }

    res.status(201).json({ 
      success: true, 
      message: "Booking confirmed", 
      bookingId: booking._id 
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  addMovie,
  uploadMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getShowtimes,
  getAvailableSeats,
  bookSeats
};