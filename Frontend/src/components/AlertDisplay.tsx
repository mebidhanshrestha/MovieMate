import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Alert {
  _id: string;
  message: string;
  link: string | null;
  type: "banner" | "movie" | "system";
  read: boolean;
  createdAt: string;
}

interface AlertDisplayProps {
  userId: string | null;
}

const AlertDisplay: React.FC<AlertDisplayProps> = ({ userId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch alerts on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchAlerts();
      fetchUnreadCount();

      // Set up polling for new alerts every 60 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [userId]);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Only show the 5 most recent notifications in the dropdown
      setAlerts(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/unread`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (alertId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/${alertId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert._id === alertId ? { ...alert, read: true } : alert
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`Alert ${alertId} marked as read`);
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Make the API call to mark all as read
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update all alerts to be read
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => ({ ...alert, read: true }))
      );
      
      // Set unread count to 0
      setUnreadCount(0);
      
      console.log("All alerts marked as read");
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    
    // If opening the dropdown, fetch fresh alerts
    if (newState) {
      fetchAlerts();
    }
  };

  const handleAlertClick = (alert: Alert, event: React.MouseEvent) => {
    // First mark as read if needed
    if (!alert.read) {
      markAsRead(alert._id);
    }
    
    // Then navigate if there's a link
    if (alert.link) {
      navigate(alert.link);
      setIsDropdownOpen(false);
    }
  };

  const goToNotificationCenter = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDropdownOpen(false);
    navigate("/notifications");
  };

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center rounded-full hover:bg-gray-100 p-1.5 transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[10px] sm:text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => markAllAsRead(e)}
                className="text-xs text-primary hover:text-amber-600 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div>
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  onClick={(e) => handleAlertClick(alert, e)}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                    !alert.read ? "bg-amber-50" : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <div
                        className={`h-2 w-2 mt-1.5 rounded-full ${
                          !alert.read ? "bg-primary" : "bg-transparent"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className={`text-sm ${!alert.read ? "font-medium" : "text-gray-700"}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!alert.read && (
                      <button 
                        onClick={(e) => markAsRead(alert._id, e)}
                        className="text-primary hover:text-amber-600 p-1"
                        aria-label="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="px-4 py-2 border-t border-gray-100">
            <button
              onClick={goToNotificationCenter}
              className="w-full flex items-center justify-center gap-1 text-xs text-primary hover:text-amber-600 font-medium py-1"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDisplay;