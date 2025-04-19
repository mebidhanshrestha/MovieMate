const User = require('../models/User');
const Movie = require('../models/Movie');
const Banner = require('../models/Banner');
const Menu = require('../models/Menu');
const Booking = require('../models/Booking');

const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    
    // Define the start and end of today for consistent time queries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    console.log('Current time:', now);
    console.log('Today range:', { start: todayStart, end: todayEnd });
    
    // Movie queries using both status field and date comparison for reliability
    const hostingMoviesQuery = { 
      status: "hosting",
      end_date: { $gte: now } 
    };
    
    const expiredMoviesQuery = { 
      status: "expired"
    };
    
    // Debug banner query
    console.log('Checking active banners with query:', { active: true });
    
    // Execute all queries in parallel
    const [
      totalUsers,
      hostingMovies,
      expiredMovies,
      activeBanners, 
      menuItems,
      totalBookings,
      todayBookings,
      revenue
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(hostingMoviesQuery),
      Movie.countDocuments(expiredMoviesQuery),
      Banner.countDocuments({ active: true }),
      Menu.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lt: todayEnd
        }
      }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);
    
    console.log('Query results:', {
      totalUsers,
      hostingMovies,
      expiredMovies,
      activeBanners,
      menuItems,
      totalBookings,
      todayBookings,
      revenue: revenue.length > 0 ? revenue[0].total : 0
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        hostingMovies,
        expiredMovies,
        activeBanners,
        menuItems,
        totalBookings,
        todayBookings,
        revenue: revenue.length > 0 ? revenue[0].total : 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    // Get the most recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .populate('movie', 'title')
      .lean();
      
    // Format the bookings as activities
    const bookingActivities = recentBookings.map(booking => ({
      id: booking._id,
      type: 'Booking',
      description: `New booking for ${booking.movie?.title || 'Unknown movie'}`,
      timestamp: booking.createdAt,
      user: booking.user?.name || 'Anonymous',
      amount: booking.totalAmount
    }));
    
    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
      
    // Format users as activities
    const userActivities = recentUsers.map(user => ({
      id: user._id,
      type: 'User',
      description: 'New user registered',
      timestamp: user.createdAt,
      user: user.name || 'Anonymous'
    }));
    
    // Combine and sort all activities
    const activities = [...bookingActivities, ...userActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

const getBookingsChartData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get bookings grouped by month for current year
    const bookingsData = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Format for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);
    
    bookingsData.forEach(item => {
      if (item._id >= 1 && item._id <= 12) {
        data[item._id - 1] = item.count;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        labels: months,
        datasets: [{
          label: 'Bookings',
          data,
          backgroundColor: 'rgba(251, 199, 0, 0.2)',
          borderColor: '#FBC700',
          borderWidth: 2
        }]
      }
    });
  } catch (error) {
    console.error('Error fetching bookings chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings chart data',
      error: error.message
    });
  }
};

const getRevenueChartData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get revenue grouped by month for current year
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Format for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);
    
    revenueData.forEach(item => {
      if (item._id >= 1 && item._id <= 12) {
        data[item._id - 1] = item.total;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue',
          data,
          backgroundColor: 'rgba(251, 199, 0, 0.2)',
          borderColor: '#FBC700',
          borderWidth: 2
        }]
      }
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue chart data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getRecentActivities,
  getBookingsChartData,
  getRevenueChartData
};