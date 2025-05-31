const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const userRoutes = require('./routes/userRoute');
const movieRoute = require('./routes/movieRoute');
const roomRoute = require('./routes/roomRoute');
const menuRoutes = require('./routes/menuRoutes');
const historyRoutes = require('./routes/historyRoute');
const Movie = require('./models/Movie');
const bookingRoutes = require('./routes/bookingRoutes'); 
const esewaRoutes = require('./routes/esewaRoutes');
const loyaltypointRoutes = require('./routes/loyaltypointRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoute');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Debug: Log working directory
console.log('Server starting in directory:', process.cwd());

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH method
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Added to support credentials
}));
app.use(express.urlencoded({ extended: true }));

// Static file serving - debug
console.log('Uploads path:', path.join(process.cwd(), 'uploads'));
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use("/api/movie", movieRoute);
app.use("/api/room", roomRoute);
app.use("/api/history", historyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/booking-management", bookingRoutes);
app.use('/api/esewa', esewaRoutes);
app.use('/api/loyalty-points', loyaltypointRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Movie Booking API is running...');
});

// Test route for static files
app.get('/test-uploads', (req, res) => {
  try {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    let files = [];
    
    // Function to recursively get files
    const getFiles = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          getFiles(fullPath);
        } else {
          files.push(fullPath.replace(process.cwd(), ''));
        }
      }
    };
    
    if (fs.existsSync(uploadsPath)) {
      getFiles(uploadsPath);
      res.json({ 
        message: 'Uploads directory contents',
        files: files
      });
    } else {
      res.json({ 
        message: 'Uploads directory does not exist',
        path: uploadsPath
      });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});