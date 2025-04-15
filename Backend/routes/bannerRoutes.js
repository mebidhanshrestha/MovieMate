const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banner');
const Alert = require('../models/Alert');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Debug: Log current working directory for banner routes
console.log('Current working directory for banner routes:', process.cwd());

// Set up storage for uploaded files - matching the existing structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use 'uploads/banners' to match your static file serving setup
    const uploadDir = 'uploads/banners';
    const fullUploadPath = path.join(process.cwd(), uploadDir);
    
    // Debug: Log the full upload path
    console.log('Banner upload directory path:', fullUploadPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullUploadPath)) {
      console.log(`Creating directory: ${fullUploadPath}`);
      fs.mkdirSync(fullUploadPath, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `banner-${Date.now()}${path.extname(file.originalname)}`;
    console.log('Generated filename for banner:', fileName);
    cb(null, fileName);
  }
});

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      console.log('Banner image accepted:', file.originalname, file.mimetype);
      cb(null, true);
    } else {
      console.log('Banner image rejected:', file.originalname, file.mimetype);
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    console.log('Retrieved all banners:', banners.length);
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active banners only (for the homepage)
router.get('/active', async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    console.log('Retrieved active banners:', banners.length);
    if (banners.length > 0) {
      console.log('Sample banner data:', banners[0]);
    }
    res.json(banners);
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new banner (admin only)
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Banner creation request body:', req.body);
    
    if (!req.file) {
      console.error('No file uploaded for banner');
      return res.status(400).json({ message: 'Image is required' });
    }

    console.log('Uploaded banner file:', req.file);
    const { title, altText, active, order } = req.body;
    
    // Store banner path without /uploads prefix as that's added by static middleware
    const imagePath = `/banners/${req.file.filename}`;
    console.log('Banner image path to be saved in DB:', imagePath);

    const newBanner = new Banner({
      title,
      altText,
      image: imagePath,
      active: active === 'true' || active === true,
      order: parseInt(order) || 0
    });

    await newBanner.save();
    console.log('Banner saved successfully:', newBanner);
    
    // Create a global alert for the new banner
    try {
      const newAlert = new Alert({
        message: `New event added: ${title}`,
        link: '/',
        type: 'banner',
        global: true
      });
      
      await newAlert.save();
      console.log('Banner alert created successfully');
    } catch (alertError) {
      console.error('Error creating banner alert:', alertError);
      // Don't fail the banner creation if alert creation fails
    }
    
    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a banner (admin only)
router.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Banner update request for ID:', req.params.id);
    console.log('Update request body:', req.body);
    
    const { title, altText, active, order } = req.body;
    const bannerId = req.params.id;
    
    const updateData = {
      title,
      altText,
      active: active === 'true' || active === true,
      order: parseInt(order) || 0
    };

    // If a new image is uploaded, update the image path
    if (req.file) {
      // Store without /uploads prefix
      updateData.image = `/banners/${req.file.filename}`;
      console.log('New banner image path:', updateData.image);
      
      // Get the old banner to delete its image
      const oldBanner = await Banner.findById(bannerId);
      if (oldBanner && oldBanner.image) {
        // For file system path, prepend uploads directory
        const imagePath = path.join(process.cwd(), 'uploads', oldBanner.image);
        console.log('Attempting to delete old banner image at:', imagePath);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Old banner image deleted successfully');
        } else {
          console.log('Old banner image file not found at:', imagePath);
        }
      }
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId, 
      updateData, 
      { new: true }
    );

    if (!updatedBanner) {
      console.log('Banner not found for update');
      return res.status(404).json({ message: 'Banner not found' });
    }

    console.log('Banner updated successfully:', updatedBanner);
    res.json(updatedBanner);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle banner active status (admin only)
router.patch('/:id/toggle', verifyAdmin, async (req, res) => {
  try {
    console.log('Toggle banner status for ID:', req.params.id);
    
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      console.log('Banner not found for toggle');
      return res.status(404).json({ message: 'Banner not found' });
    }

    const previousActive = banner.active;
    banner.active = !banner.active;
    await banner.save();
    
    // If banner was activated, create an alert
    if (!previousActive && banner.active) {
      try {
        const newAlert = new Alert({
          message: `New banner activated: ${banner.title}`,
          link: '/',
          type: 'banner',
          global: true
        });
        
        await newAlert.save();
        console.log('Banner activation alert created successfully');
      } catch (alertError) {
        console.error('Error creating banner activation alert:', alertError);
        // Don't fail the banner toggle if alert creation fails
      }
    }
    
    console.log('Banner status toggled to:', banner.active);
    res.json(banner);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a banner (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    console.log('Delete banner request for ID:', req.params.id);
    
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      console.log('Banner not found for deletion');
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete the image file if it exists
    if (banner.image) {
      // For file system path, prepend uploads directory
      const imagePath = path.join(process.cwd(), 'uploads', banner.image);
      console.log('Attempting to delete banner image at:', imagePath);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Banner image file deleted successfully');
      } else {
        console.log('Banner image file not found at:', imagePath);
      }
    }

    await Banner.findByIdAndDelete(req.params.id);
    console.log('Banner deleted successfully');
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;