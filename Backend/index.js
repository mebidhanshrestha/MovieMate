const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const userRoutes = require('./routes/userRoute')
const movieRoute = require('./routes/movieRoute');

const roomRoute = require('./routes/roomRoute');
const menuRoutes = require('./routes/menuRoutes');

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

// Routes placeholder
app.get('/', (req, res) => {
  res.send('Movie Booking API is running...');
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
