import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Import jwt-decode as a named import
import logo from "../assets/images/moviemate-logo.svg";
import {
  LayoutDashboard,
  Film,
  Calendar,
  Coffee,
  LogOut,
  Menu as MenuIcon,
  X,
  BookText,
  Bell,
  Users,
} from "lucide-react";
import { Bar, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  details?: {
    amount?: number;
    movie_title?: string;
  };
}

interface JwtPayload {
  id: string;
  role: string;
}

interface DashboardMetrics {
  totalUsers: number;
  hostingMovies: number;
  expiredMovies: number;
  activeBanners: number;
  menuItems: number;
  totalBookings: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

const DashboardLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("Admin User"); // State for dynamic username
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    hostingMovies: 0,
    expiredMovies: 0,
    activeBanners: 0,
    menuItems: 0,
    totalBookings: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Fetch user data for username
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No authentication token found");
          return;
        }

        // Decode JWT to get user ID
        const decoded: JwtPayload = jwtDecode(token);
        const userId = decoded.id;

        // Fetch user data using /api/users/:id
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: token,
          },
        });

        if (response.data && response.data.name) {
          setUsername(response.data.name);
        } else {
          console.warn("No user name found in response");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Keep default "Admin User" if fetch fails
      }
    };

    fetchUserData();
  }, []);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.warn("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notifications`, {
          headers: {
            Authorization: token
          }
        });

        if (response.data && response.data.success && Array.isArray(response.data.notifications)) {
          setNotifications(response.data.notifications);
        } else {
          // Fallback if API returns invalid format
          console.warn("Invalid notification data format from API");
          setFallbackNotifications();
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Use fallback data on error
        setFallbackNotifications();
      } finally {
        setLoading(false);
      }
    };

    // Set fallback notifications if API fails
    const setFallbackNotifications = () => {
      setNotifications([
        {
          _id: "1",
          type: "payment",
          message: "",
          read: false,
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          details: {
            amount: 1500,
            movie_title: "Avengers movie"
          }
        },
        {
          _id: "2",
          type: "payment",
          message: "",
          read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: {
            amount: 850,
            movie_title: "Inception movie"
          }
        },
        {
          _id: "3",
          type: "payment",
          message: "",
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          details: {
            amount: 1200,
            movie_title: "Batman movie"
          }
        },
      ]);
    };

    fetchNotifications();

    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/metrics`, {
        headers: { Authorization: token }
      });
      
      if (response.data?.success) {
        setMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format relative time for notifications
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.warn("No authentication token found");
        return;
      }
      
      // Update UI immediately for better UX
      setNotifications(
        notifications.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );

      // Update on server
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: token
        }
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert UI change if server update fails
      setNotifications(
        notifications.map((notification) =>
          notification._id === id ? { ...notification, read: false } : notification
        )
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.warn("No authentication token found");
        return;
      }
      
      // Update UI immediately
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );

      // Update on server
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: {
          Authorization: token
        }
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Refresh notifications if server update fails
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: localStorage.getItem("token") || ""
        }
      });
      
      if (response.data && response.data.success) {
        setNotifications(response.data.notifications);
      }
    }
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/dashboard/users",
      label: "Manage Users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: "/dashboard/movie",
      label: "Manage Movies",
      icon: <Film className="w-5 h-5" />,
    },
    {
      path: "/dashboard/movie-allocate",
      label: "Movie Allocate",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      path: "/dashboard/menu",
      label: "Manage Menu",
      icon: <Coffee className="w-5 h-5" />,
    },
    {
      path: "/dashboard/bookings",
      label: "Bookings",
      icon: <BookText className="w-5 h-5" />,
    },
    {
      path: "/dashboard/manage-banner",
      label: "Manage Event",
      icon: <BookText className="w-5 h-5" />,
    },
  ];

  const renderMetricsCard = (title: string, value: number, icon: JSX.Element) => (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
      <div className="text-gray-500 mb-2">{title}</div>
      {metricsLoading ? (
        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
      ) : (
        <div className="text-3xl font-bold">{value}</div>
      )}
      <div className="mt-2 text-gray-400">{icon}</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-gray-800 text-white transition-all duration-300 hidden md:block relative`}
      >
        <div className="sticky top-0 flex flex-col h-screen">
          {/* Logo and collapse button */}
          <div
            className={`flex ${
              collapsed ? "justify-center" : "justify-between"
            } items-center p-4 border-b border-gray-700`}
          >
            {!collapsed && (
              <div className="flex items-center">
                <img src={logo} alt="MovieMate" className="h-10" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {collapsed ? (
                <MenuIcon className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      collapsed ? "justify-center" : "justify-start space-x-3"
                    } p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-[#8a6e00] text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer that pushes logout to bottom */}
          <div className="flex-grow"></div>

          {/* Logout button */}
          <div className="w-full p-4 border-t border-gray-700 mt-8">
            <button
              onClick={handleLogout}
              className={`flex items-center ${
                collapsed ? "justify-center" : "justify-start space-x-3"
              } w-full p-3 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white`}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div className="flex items-center">
              <img src={logo} alt="MovieMate" className="h-10" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-[#8a6e00] text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer that pushes logout to bottom */}
          <div className="flex-grow"></div>

          <div className="w-full p-4 border-t border-gray-700 mt-8">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 md:hidden"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 text-[#FBC700] flex items-center justify-center font-semibold">
                  {username.charAt(0).toUpperCase()}{username.charAt(1).toUpperCase() || ""}
                </div>
                <span className="hidden sm:inline font-medium">{username}</span>
              </div>
              
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown - Simplified to only show amount and movie name */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-5 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 transform -translate-x-32 sm:-translate-x-16 md:-translate-x-0">
                    <div className="py-2 px-3 bg-gray-50 border-b flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Notifications
                      </h3>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#FBC700] hover:text-[#8a6e00] font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FBC700] rounded-full animate-spin mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div>
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-3 border-b hover:bg-gray-50 ${
                                !notification.read ? "bg-yellow-50" : ""
                              } cursor-pointer`}
                              onClick={() => markAsRead(notification._id)}
                            >
                              <div className="flex justify-between items-start">
                                <p
                                  className={`text-sm ${
                                    !notification.read
                                      ? "font-medium"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {/* Simple display showing only amount and movie title */}
                                  Payment received, Rs.{notification.details?.amount || 0} received for {notification.details?.movie_title || "movie"}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-[#FBC700] rounded-full flex-shrink-0 mt-1 ml-2"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="py-2 px-3 bg-gray-50 border-t text-center">
                      <button 
                        className="text-xs text-[#FBC700] hover:text-[#8a6e00] font-medium"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {location.pathname === '/dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {renderMetricsCard('Total Users', metrics.totalUsers, <Users size={24} />)}
                  {renderMetricsCard('Hosting Movies', metrics.hostingMovies, <Film size={24} />)}
                  {renderMetricsCard('Expired Movies', metrics.expiredMovies, <Calendar size={24} />)}
                  {renderMetricsCard('Active Events', metrics.activeBanners, <BookText size={24} />)}
                  {renderMetricsCard('Menu Items', metrics.menuItems, <Coffee size={24} />)}
                  {renderMetricsCard('Total Bookings', metrics.totalBookings, <BookText size={24} />)}
                </div>
                {/* Data Visualization Chart */}
                <div className="relative w-full bg-gradient-to-br from-[#FFF9E5] via-white to-[#FFFBEA] rounded-2xl shadow-lg p-8 mb-10  border-2 border-[#FBC700]/30">
                  <div className="absolute top-4 right-6 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-[#FBC700] animate-pulse"></span>
                    <span className="text-xs font-semibold text-[#FBC700]">Live Data</span>
                  </div>
                  <h3 className="text-2xl font-extrabold mb-6 text-gray-800 tracking-tight flex items-center gap-2">
                    <span className="bg-[#FBC700]/20 px-3 py-1 rounded-lg text-[#B88900]">Dashboard Insights</span>
                  </h3>
                  <Bar
                    data={{
                      labels: [
                        'Total Users',
                        'Hosting Movies',
                        'Expired Movies',
                        'Active Events',
                        'Menu Items',
                        'Total Bookings',
                      ],
                      datasets: [
                        {
                          label: 'Count',
                          data: [
                            metrics.totalUsers,
                            metrics.hostingMovies,
                            metrics.expiredMovies,
                            metrics.activeBanners,
                            metrics.menuItems,
                            metrics.totalBookings,
                          ],
                          backgroundColor: [
                            'rgba(251, 191, 36, 0.85)', // gold
                            'rgba(96, 165, 250, 0.85)', // blue
                            'rgba(248, 113, 113, 0.85)', // red
                            'rgba(52, 211, 153, 0.85)', // green
                            'rgba(167, 139, 250, 0.85)', // purple
                            'rgba(244, 114, 182, 0.85)', // pink
                          ],
                          borderColor: [
                            '#FBC700',
                            '#60a5fa',
                            '#f87171',
                            '#34d399',
                            '#a78bfa',
                            '#f472b6',
                          ],
                          borderWidth: 2,
                          borderRadius: 10,
                          hoverBackgroundColor: '#FBC700',
                          barPercentage: 0.7,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      animation: {
                        duration: 1200,
                        easing: 'easeOutQuart',
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#222',
                          titleColor: '#FBC700',
                          bodyColor: '#fff',
                          borderColor: '#FBC700',
                          borderWidth: 1,
                          padding: 12,
                          cornerRadius: 10,
                          callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
                          },
                        },
                        title: { display: false },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: '#B88900',
                            font: { weight: 'bold', size: 14 },
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: '#FFF1C6',
                          },
                          ticks: {
                            color: '#B88900',
                            font: { weight: 'bold', size: 14 },
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;