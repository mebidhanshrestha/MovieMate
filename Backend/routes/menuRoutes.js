const express = require("express");
const multer = require("multer");
const path = require("path");
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
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Menu item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu item" });
  }
});

module.exports = router;
