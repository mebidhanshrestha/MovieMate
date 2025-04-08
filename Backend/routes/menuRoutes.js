const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Menu = require("../models/Menu");

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save uploaded files to "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage });

// Add new menu item (with image upload)
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, price, weight, calories } = req.body; // Ensure all fields are destructured
    const imageUrl = `/uploads/${req.file.filename}`; // Store file path

    const newItem = new Menu({
      name,
      price,
      weight,
      calories,
      image: imageUrl,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Error adding menu item" });
  }
});

// Update menu item
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, weight, calories } = req.body;
    
    // Find the existing menu item
    const menuItem = await Menu.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Prepare update object
    const updateData = {
      name,
      price,
      weight,
      calories,
    };

    // If a new image was uploaded, update the image field
    if (req.file) {
      // Delete the old image file if it exists
      const oldImagePath = path.join(__dirname, '..', menuItem.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      
      // Update with new image path
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Update the menu item
    const updatedItem = await Menu.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating menu item" });
  }
});

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await Menu.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu" });
  }
});

// Delete menu item
router.delete("/delete/:id", async (req, res) => {
  try {
    // Find the menu item to get the image path
    const menuItem = await Menu.findById(req.params.id);
    if (menuItem) {
      // Delete the image file if it exists
      const imagePath = path.join(__dirname, '..', menuItem.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the menu item from the database
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Menu item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu item" });
  }
});

module.exports = router;