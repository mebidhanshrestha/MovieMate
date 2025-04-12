const express = require("express");
const { allocateMovieToRoom, getRoomShowtimes, getRooms, updateShowtime, deleteShowtime, getRoomById } = require("../controllers/roomController");

const router = express.Router();

router.post("/allocate-movie", allocateMovieToRoom);
router.get("/:room_id/showtimes", getRoomShowtimes);
// Add these two new routes after your existing routes
router.put("/showtime/:showtimeId", updateShowtime);
router.delete("/showtime/:showtimeId", deleteShowtime);
router.post("/therater", getRoomById); // Fix: Use getRoomShowtimes instead of getRooms
router.get("/", getRooms);

module.exports = router; // Fix: Use module.exports
