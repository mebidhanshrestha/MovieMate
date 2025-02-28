const express = require("express");
const { 
  addMovie, 
  uploadMovie, 
  getMovies, 
  getMovieById,
  updateMovie,
  deleteMovie,
  getShowtimes, 
  getAvailableSeats, 
  bookSeats
} = require("../controllers/movieController");
const router = express.Router();

// Movie CRUD operations
router.post("/add", uploadMovie, addMovie);
router.get("/", getMovies);
router.get("/:id", getMovieById);
router.put("/:id", uploadMovie, updateMovie);
router.delete("/:id", deleteMovie);

// Get showtimes for a specific movie - keep the original route with double 's'
router.get("/:movieId/showtimess", getShowtimes);

// Get available seats for a specific showtime
router.get("/showtimes/:showtimeId/seats", getAvailableSeats);

// Book seats for a movie
router.post("/", bookSeats);

module.exports = router;