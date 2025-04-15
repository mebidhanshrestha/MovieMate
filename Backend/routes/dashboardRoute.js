const express = require('express');
const { 
  getDashboardMetrics, 
  getRecentActivities,
  getBookingsChartData,
  getRevenueChartData 
} = require('../controllers/dashboardController');
const Movie = require('../models/Movie');
const router = express.Router();

// Dashboard metrics route
router.get('/metrics', getDashboardMetrics);
router.get('/activities', getRecentActivities);
router.get('/bookings-chart', getBookingsChartData);
router.get('/revenue-chart', getRevenueChartData);

// Debug route
router.get('/debug/movies', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getTime() + (5 * 60 + 45) * 60 * 1000);
    today.setHours(0, 0, 0, 0);
    
    const movies = await Movie.find().lean();
    
    const filteredMovies = movies.filter(movie => 
      movie.showtimes?.some(st => {
        const showtimeDate = new Date(st.date);
        return showtimeDate >= today && 
               showtimeDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      })
    );
    
    res.status(200).json({
      success: true,
      dateUsed: today,
      count: filteredMovies.length,
      allMoviesCount: movies.length,
      movies: filteredMovies.map(m => ({
        title: m.title,
        showtimes: m.showtimes?.map(st => ({
          date: st.date,
          parsedDate: new Date(st.date),
          isToday: new Date(st.date) >= today && 
                   new Date(st.date) < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        })),
        end_date: m.end_date
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
