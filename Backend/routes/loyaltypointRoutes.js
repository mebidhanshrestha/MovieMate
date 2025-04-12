// routes/loyaltyPointRoutes.js
const express = require('express');
const router = express.Router();
const loyaltyPointController = require('../controllers/loyaltypointController');

// GET route to fetch loyalty points for a specific user
router.get('/user/:userId', loyaltyPointController.getLoyaltyPoints);

// POST route to create new loyalty points for a user
router.post('/', loyaltyPointController.createLoyaltyPoints);

// PUT route to update loyalty points for a user
router.put('/user/:userId', loyaltyPointController.updateLoyaltyPoints);

module.exports = router;