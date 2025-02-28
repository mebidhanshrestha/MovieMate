import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Movie from '../models/Movie.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';  

// Set up Multer storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const { title, description, duration, start_date, end_date, status, type } = req.body;

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
      image: imageUrl
    });
    await newMovie.save();

    res.status(201).json({ message: "Movie added successfully", movie: newMovie });
  } catch (error) {
    console.error("Error adding movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to handle file upload for adding a movie
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

// Get showtimes for a specific movie
// export const getShowtimes = async (req, res) => {
//   try {
//     const { movieId } = req.params;
//     const rooms = await Room.find({ "showtimes.movie_id": movieId }, "name showtimes");
//     res.status(200).json({ success: true, rooms });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

export const getShowtimes = async (req, res) => {
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
export const getAvailableSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const room = await Room.findOne({ "showtimes._id": showtimeId }, { "showtimes.$": 1 });
    if (!room) return res.status(404).json({ success: false, message: "Showtime not found" });
    res.status(200).json({ success: true, seats: room.showtimes[0].seats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Book seats
export const bookSeats = async (req, res) => {
  try {
    const { user_id, movie_id, room_id, date, time_slot, seats } = req.body;

    // Check if seats are available
    const room = await Room.findOne({ _id: room_id, "showtimes._id": time_slot });
    if (!room) return res.status(404).json({ success: false, message: "Room or Showtime not found" });

    const showtime = room.showtimes.id(time_slot);
    const unavailableSeats = showtime.seats.filter(s => seats.includes(s.seat_number) && s.status === "booked");
    if (unavailableSeats.length > 0) return res.status(400).json({ success: false, message: "Some seats are already booked" });

    // Update seat status to booked
    showtime.seats.forEach(seat => {
      if (seats.includes(seat.seat_number)) seat.status = "booked";
    });
    await room.save();

    // Create booking entry
    const booking = new Booking({ user_id, movie_id, room_id, date, time_slot, seats, status: "confirmed" });
    await booking.save();

    res.status(201).json({ success: true, message: "Booking confirmed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addMovie, uploadMovie, getMovies };