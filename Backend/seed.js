require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust the path if needed

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashedPassword = await bcrypt.hash('artist123', 10); // Change password for security

    const adminUser = new User({
      name: 'Artist',
      email: 'artist@gmail.com',
      password: hashedPassword,
      role: 'artist',
    });

    await adminUser.save();
    console.log('Admin user added successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();