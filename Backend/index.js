const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const userRoutes = require('./routes/userRoute')
const movieRoute = require('./routes/movieRoute');
const roomRoute = require('./routes/roomRoute');
const menuRoutes = require('./routes/menuRoutes');
const historyRoutes = require('./routes/historyRoute');
const Movie = require('./models/Movie');
const bookingRoutes = require('./routes/bookingRoutes'); 
const esewaRoutes = require('./routes/esewaRoutes');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use("/api/movie", movieRoute);
app.use("/api/room", roomRoute);
app.use("/api/history", historyRoutes);
// FIXED: This was wrong - it was using movieRoute for bookings
app.use("/api/bookings", bookingRoutes); // Changed from movieRoute to bookingRoutes
app.use("/api/booking-management", bookingRoutes);
app.use('/api/esewa', esewaRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Movie Booking API is running...');
});

// Cron job for updating expired movies
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});