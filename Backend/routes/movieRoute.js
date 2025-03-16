const express = require("express");
const { addMovie, uploadMovie, getMovies, getShowtimes, getAvailableSeats, bookSeats} = require("../controllers/movieController");
const router = express.Router();

// Use uploadMovie middleware before the addMovie controller
router.post("/add", uploadMovie, addMovie);
router.get("/", getMovies)

// router.get("/movies", getMovies);

// Get showtimes for a specific movie
router.get("/:movieId/showtimes", getShowtimes);

// Get available seats for a specific showtime
router.get("/showtimes/:showtimeId/seats", getAvailableSeats);

// Book seats for a movie
router.post("/", bookSeats);

module.exports = router;
