const Movie = require("../models/Movie");

// Add a movie to the database
const multer = require("multer");
const path = require("path");

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
    const { title, description, duration, start_date, end_date, status, type } = req.body;

    if (!title || !duration || !start_date || !end_date || !status || !type || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }
        const imageUrl = `/uploads/${req.file.filename}`; // Store file path
    
        const newMovie = new Movie({ title,
          description,
          duration,
          start_date,
          end_date,
          status,
          type,
           image: imageUrl });
        await newMovie.save();

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
module.exports = { addMovie, uploadMovie, getMovies };
