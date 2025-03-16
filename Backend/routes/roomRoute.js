const express = require("express");
const { allocateMovieToRoom, getRoomShowtimes, getRooms } = require("../controllers/roomController");

const router = express.Router();

router.post("/allocate-movie", allocateMovieToRoom);
router.get("/:room_id/showtimes", getRoomShowtimes);

router.get("/", getRooms);

module.exports = router; // Fix: Use module.exports
