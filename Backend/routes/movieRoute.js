const express = require("express");
const { addMovie, uploadMovie, getMovies } = require("../controllers/movieController");
const router = express.Router();

// Use uploadMovie middleware before the addMovie controller
router.post("/add", uploadMovie, addMovie);
router.get("/", getMovies)

module.exports = router;
