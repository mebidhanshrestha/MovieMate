const express = require('express');
const router = express.Router();
const { 
  getAllNotifications, 
  createNotification, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');

// Get all notifications - only for admin
router.get('/', verifyAdmin, getAllNotifications);

// Create a new notification - admin only
router.post('/', verifyAdmin, createNotification);

// Mark a notification as read
router.patch('/:id/read', verifyToken, markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', verifyToken, markAllAsRead);

// Delete a notification
router.delete('/:id', verifyAdmin, deleteNotification);

module.exports = router;