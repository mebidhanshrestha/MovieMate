const express = require("express");
const historyController = require("../controllers/historyController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Get user's complete history
router.get("/user/:userId", verifyToken, historyController.getUserHistory);

// Get details for a specific sales record
router.get("/sales/:salesId", verifyToken, historyController.getSalesDetails);

// Get only movie ticket history
router.get("/user/:userId/movies", verifyToken, historyController.getMovieHistory);

// Get only concessions history
router.get("/user/:userId/concessions", verifyToken, historyController.getConcessionsHistory);

module.exports = router;