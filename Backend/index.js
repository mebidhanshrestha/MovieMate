const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const userRoutes = require('./routes/userRoute')
const movieRoute = require('./routes/movieRoute');
const roomRoute = require('./routes/roomRoute');
const menuRoutes = require('./routes/menuRoutes');
const historyRoutes = require('./routes/historyRoute'); // Add this line
const Movie = require('./models/Movie'); // Adjust path as needed
// npm install node-cron
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true })); // For URL-encoded data

app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/movie", movieRoute);
app.use("/api/room", roomRoute);
app.use("/api/bookings", movieRoute);
app.use("/api/history", historyRoutes); // Add this line

// Routes placeholder
app.get('/', (req, res) => {
  res.send('Movie Booking API is running...');
});



// Run every day at midnight
cron.schedule('5 21 * * *', async () => {
  try {
    const currentDate = new Date();
    const result = await Movie.updateMany(
      { end_date: { $lt: currentDate }, status: "hosting" },
      { $set: { status: "expired" } }
    );
    console.log(`Updated ${result.modifiedCount} expired movies`);
  } catch (error) {
    console.error('Error updating expired movies:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kathmandu"
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});