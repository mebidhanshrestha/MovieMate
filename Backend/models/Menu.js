const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  weight: Number,
  calories: Number,
  image: String // URL for menu image
});
module.exports = mongoose.model('Menu', menuSchema);