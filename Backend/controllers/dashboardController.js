const User = require('../models/User');
const Movie = require('../models/Movie');
const Banner = require('../models/Banner');
const Menu = require('../models/Menu');
const Booking = require('../models/Booking');

const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    
    // Debug: Check active banners query
    console.log('Checking active banners with query:', { active: true });
    const activeBannersCount = await Banner.countDocuments({ active: true });
    console.log('Active banners count:', activeBannersCount);
    
    const [
      totalUsers,
      hostingMovies,
      expiredMovies,
      menuItems,
      totalBookings,
      todayBookings,
      revenue
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments({ 
        start_date: { $lte: now },
        end_date: { $gte: now }
      }),
      Movie.countDocuments({ end_date: { $lt: now } }),
      Menu.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        hostingMovies,
        expiredMovies,
        activeBanners: activeBannersCount,
        menuItems,
        totalBookings,
        todayBookings,
        revenue: revenue.length > 0 ? revenue[0].total : 0
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics'
    });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    // In a real app, you would query your activity logs
    const activities = [
      {
        id: '1',
        type: 'Booking',
        description: 'New booking for Avengers movie',
        timestamp: new Date().toISOString(),
        user: 'user123'
      },
      {
        id: '2',
        type: 'User',
        description: 'New user registered',
        timestamp: new Date(Date.now() - 10000000).toISOString(),
        user: 'system'
      }
    ];
    
    res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
};

const getBookingsChartData = async (req, res) => {
  try {
    // Get bookings grouped by month
    const bookingsData = await Booking.aggregate([
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
      data[item._id - 1] = item.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        labels: months,
        datasets: [{
          label: 'Bookings',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings chart data'
    });
  }
};

const getRevenueChartData = async (req, res) => {
  try {
    // Get revenue grouped by month
    const revenueData = await Booking.aggregate([
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
      data[item._id - 1] = item.total;
    });
    
    res.status(200).json({
      success: true,
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue chart data'
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getRecentActivities,
  getBookingsChartData,
  getRevenueChartData
};
