import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
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
} from "lucide-react";

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

const DashboardLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

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

        const response = await axios.get("http://localhost:3001/api/notifications", {
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
          message: "Payment received, Rs.1500 received for Avengers movie",
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
          message: "Payment received, Rs.850 received for Inception movie",
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
          message: "Payment received, Rs.1200 received for Batman movie",
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
      await axios.patch(`http://localhost:3001/api/notifications/${id}/read`, {}, {
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
      await axios.post(`http://localhost:3001/api/notifications/mark-all-read`, {}, {
        headers: {
          Authorization: token
        }
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Refresh notifications if server update fails
      const response = await axios.get("http://localhost:3001/api/notifications", {
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
  ];

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
                  AM
                </div>
                <span className="hidden sm:inline font-medium">Admin User</span>
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;