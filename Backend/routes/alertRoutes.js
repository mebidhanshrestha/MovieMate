const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Get all alerts for a user
router.get('/user', verifyToken, async (req, res) => {
  try {
    // Get userId from authenticated request
    const userId = req.user.id;
    console.log(`Getting alerts for user: ${userId}`);
    
    // Get both user-specific alerts and global alerts
    const alerts = await Alert.find({
      $or: [
        { userId: userId },
        { global: true }
      ]
    }).sort({ createdAt: -1 }).limit(30);
    
    console.log(`Retrieved ${alerts.length} alerts for user`);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count for a user
router.get('/user/unread', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Count unread alerts (both user-specific and global)
    const count = await Alert.countDocuments({
      $or: [
        { userId: userId, read: false },
        { global: true, read: false }
      ]
    });
    
    console.log(`Unread alert count for user ${userId}: ${count}`);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark an alert as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const alertId = req.params.id;
    
    console.log(`Attempting to mark alert ${alertId} as read for user ${userId}`);
    
    // First, check if the alert exists
    const existingAlert = await Alert.findById(alertId);
    if (!existingAlert) {
      console.log(`Alert not found: ${alertId}`);
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // If it's already read, just return success
    if (existingAlert.read) {
      console.log(`Alert ${alertId} is already marked as read`);
      return res.json(existingAlert);
    }
    
    // Update the alert, ensuring it belongs to this user or is global
    const alert = await Alert.findOneAndUpdate(
      { 
        _id: alertId,
        $or: [
          { userId: userId },
          { global: true }
        ]
      },
      { read: true },
      { new: true }
    );
    
    if (!alert) {
      console.log(`Alert not found or not accessible by user ${userId}`);
      return res.status(404).json({ message: 'Alert not found or not accessible' });
    }
    
    console.log(`Alert ${alertId} marked as read successfully`);
    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all alerts as read for a user
router.patch('/user/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Marking all alerts as read for user ${userId}`);
    
    // Update all alerts for this user
    const result = await Alert.updateMany(
      {
        $or: [
          { userId: userId, read: false },
          { global: true, read: false }
        ]
      },
      { read: true }
    );
    
    console.log(`Marked ${result.modifiedCount} alerts as read for user ${userId}`);
    res.json({ success: true, count: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new global alert (admin only)
router.post('/global', verifyAdmin, async (req, res) => {
  try {
    const { message, link, type } = req.body;
    
    console.log('Creating new global alert:', { message, type });
    
    const newAlert = new Alert({
      message,
      link,
      type: type || 'system',
      global: true
    });
    
    await newAlert.save();
    console.log('Global alert created successfully');
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating global alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;