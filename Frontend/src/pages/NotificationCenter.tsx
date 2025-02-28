import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { Bell, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Alert {
  _id: string;
  message: string;
  link: string | null;
  type: "banner" | "movie" | "system";
  read: boolean;
  createdAt: string;
}

const NotificationCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError("Failed to load notifications. Please try again later.");
      setLoading(false);
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

      // Update local state to reflect the change
      setAlerts(prevAlerts =>
        prevAlerts.map((alert) =>
          alert._id === alertId ? { ...alert, read: true } : alert
        )
      );
      
      console.log(`Alert ${alertId} marked as read`);
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state to mark all as read
      setAlerts(prevAlerts =>
        prevAlerts.map((alert) => ({ ...alert, read: true }))
      );
      
      console.log("All alerts marked as read");
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  const handleAlertClick = (alert: Alert, event: React.MouseEvent) => {
    // Mark as read if it's not already read
    if (!alert.read) {
      markAsRead(alert._id);
    }
    
    // Navigate if there's a link
    if (alert.link) {
      navigate(alert.link);
    }
  };

  const goBack = () => {
    navigate(-1); // Navigate back to the previous page
  };
  
  // Get the count of unread notifications
  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Format the date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  // Get appropriate icon for the alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "banner":
        return <Bell className="h-5 w-5 text-primary" />;
      case "movie":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "system":
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={goBack}
        className="flex items-center text-primary hover:text-amber-600 mb-4 font-medium transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-medium text-gray-900">Your Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={(e) => markAllAsRead(e)}
              className="flex items-center text-sm text-primary hover:text-amber-600 font-medium"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`px-6 py-4 hover:bg-gray-50 ${
                  !alert.read ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={(e) => handleAlertClick(alert, e)}
                      >
                        <p
                          className={`text-sm ${
                            !alert.read ? "font-medium text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                      {!alert.read && (
                        <button 
                          onClick={(e) => markAsRead(alert._id, e)}
                          className="ml-2 p-1 text-primary hover:text-amber-600 rounded-full hover:bg-gray-100"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center text-xs text-gray-500">
            Notifications are automatically removed after 30 days
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;