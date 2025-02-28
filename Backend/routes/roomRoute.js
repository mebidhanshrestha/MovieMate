const express = require("express");
const { allocateMovieToRoom, getRoomShowtimes } = require("../controllers/roomController");

const router = express.Router();

router.post("/allocate-movie", allocateMovieToRoom);
router.get("/:room_id/showtimes", getRoomShowtimes);

module.exports = router; // Fix: Use module.exports
