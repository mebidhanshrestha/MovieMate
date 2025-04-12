import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { FiFilm, FiCoffee, FiEye, FiPrinter, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// Types
interface MenuItemPurchase {
  menu_id: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface SalesRecord {
  _id: string;
  user_id: string;
  username: string;
  movie_id?: {
    _id: string;
    title: string;
    description: string;
    duration: number;
    image: string;
    type: string;
  };
  menu_items: MenuItemPurchase[];
  date: string | null | undefined; // Allow null or undefined
  time: string;
  payment_method: string;
  total_amount: number;
  concessionsTotal?: number;
  seats?: string[]; // Add seats array
  room_id?: { // Add room information
    _id: string;
    name: string;
  };
}

interface HistoryData {
  movieTickets: SalesRecord[];
  concessions: SalesRecord[];
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryData>({
    movieTickets: [],
    concessions: [],
  });
  const [activeTab, setActiveTab] = useState<"movies" | "concessions">(
    "movies"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null);

  const navigate = useNavigate();

  // Use the correct keys to match your login component
  const userId = localStorage.getItem("id") || "";
  const token = localStorage.getItem("token") || "";

  // Safe image URL handler
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/placeholder-movie.jpg";

    // If the path is relative to your backend server, make it absolute
    if (imagePath.startsWith("/uploads")) {
      return `http://localhost:3001${imagePath}`;
    }

    return imagePath;
  };

  // Safe number formatting
  const safeToFixed = (value?: number, decimals: number = 2): string => {
    if (value == null) return "0.00";
    return value.toFixed(decimals);
  };

  // Updated concessions total calculation with safety checks
  const calculateConcessionsTotal = (
    menuItems?: MenuItemPurchase[]
  ): number => {
    if (!menuItems || menuItems.length === 0) return 0;

    return menuItems.reduce((total, item) => {
      // Safely handle potential undefined values
      const itemPrice = item.menu_id?.price || 0;
      const itemQuantity = item.quantity || 0;
      return total + itemPrice * itemQuantity;
    }, 0);
  };

  // Safe total items calculation
  const getTotalItems = (menuItems?: MenuItemPurchase[]): number => {
    if (!menuItems) return 0;
    return menuItems.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  // Format seats array to display nicely
  const formatSeats = (seats?: string[]): string => {
    if (!seats || seats.length === 0) return "N/A";
    return seats.join(", ");
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        console.log("User ID:", userId);
        console.log("Token exists:", !!token);

        if (!userId || !token) {
          setError("Not logged in or missing user information");
          setLoading(false);
          return;
        }

        const authToken = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
        console.log(
          "Using auth token format:",
          token.startsWith("Bearer ")
            ? "Already has Bearer"
            : "Added Bearer prefix"
        );

        const response = await axios.get(
          `http://localhost:3001/api/history/user/${userId}`,
          {
            headers: { Authorization: authToken },
          }
        );

        console.log("API Response data:", response.data.history);

        if (response.data.success) {
          // Log any records with null dates
          response.data.history.movieTickets.forEach((sale: SalesRecord) => {
            if (!sale.date) {
              console.warn("Found null date in movie ticket:", sale);
            }
          });
          response.data.history.concessions.forEach((sale: SalesRecord) => {
            if (!sale.date) {
              console.warn("Found null date in concession:", sale);
            }
          });

          setHistory(response.data.history);
        } else {
          setError(
            "Failed to load history: " +
              (response.data.message || "Unknown error")
          );
        }
      } catch (err: any) {
        console.error("Error fetching history:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          console.error("Status code:", err.response.status);
          if (err.response.status === 401) {
            console.log("Authentication failed, redirecting to login");
            setError("Your session has expired. Please log in again.");
          } else {
            setError(
              `Server error: ${err.response.status} - ${
                err.response.data.message || "Unknown error"
              }`
            );
          }
        } else if (err.request) {
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          setError("Error setting up request: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, token, navigate]);

  // Handle viewing details
  const handleViewDetails = async (salesId: string) => {
    try {
      console.log("Fetching details for sale:", salesId);

      // Use the correct auth token format
      const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

      const response = await axios.get(
        `http://localhost:3001/api/history/sales/${salesId}`,
        {
          headers: { Authorization: authToken },
        }
      );

      console.log("Sales details response:", response.data);

      if (response.data.success) {
        setSelectedSale(response.data.sale);
        setIsModalOpen(true);
      } else {
        console.error("Failed to get sale details:", response.data.message);
      }
    } catch (err: any) {
      console.error("Error fetching sales details:", err);

      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        alert(
          "Failed to load details: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  // Format date for display
  // Replace your current formatDate function with this improved version
  const formatDate = (dateStr: string | null | undefined): string => {
    // If dateStr is null or undefined, return a fallback
    if (!dateStr || dateStr === "null" || dateStr === "undefined") {
      console.warn("Date is null or undefined, using fallback");
      return "Recent purchase";
    }

    try {
      // Skip processing invalid dates or unix epoch (which would show as Jan 1, 1970)
      if (dateStr === "1970-01-01" || new Date(dateStr).getFullYear() <= 1970) {
        console.log("Invalid date detected (epoch):", dateStr);
        return "Recent purchase";
      }

      // Handle ISO format dates (with T and Z)
      if (dateStr.includes("T") || dateStr.includes("Z")) {
        return format(parseISO(dateStr), "MMM dd, yyyy");
      }

      // Handle YYYY-MM-DD format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return format(parseISO(dateStr), "MMM dd, yyyy");
      }

      // Fallback - direct date parsing
      const parsedDate = new Date(dateStr);

      // Extra validation to check if the date is valid and not the epoch
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1970) {
        console.log("Invalid date after parsing:", dateStr);
        return "Recent purchase";
      }

      return format(parsedDate, "MMM dd, yyyy");
    } catch (err) {
      console.error("Date formatting error:", dateStr, err);
      return "Recent purchase";
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleTryAgain = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-gray-600">Loading your purchase history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 text-gray-800 px-4 sm:px-6 py-4 rounded relative my-6 max-w-4xl mx-auto">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleTryAgain}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition duration-150"
          >
            Try Again
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-150"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 pb-2 border-b-2 border-yellow-500 inline-block">
        My Purchase History
      </h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("movies")}
              className={`${
                activeTab === "movies"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-md flex items-center`}
            >
              <FiFilm className="mr-2" />
              Movie Tickets ({history.movieTickets.length})
            </button>
            <button
              onClick={() => setActiveTab("concessions")}
              className={`${
                activeTab === "concessions"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-md flex items-center`}
            >
              <FiCoffee className="mr-2" />
              Food & Beverages ({history.concessions.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="mt-6">
        {activeTab === "movies" && (
          <>
            {history.movieTickets.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                <FiFilm className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No movie tickets
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't purchased any movie tickets yet.
                </p>
                <div className="mt-6">
                  <a
                    href="/movies"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
                  >
                    Browse Movies
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {history.movieTickets.map((sale) => (
                  <div
                    key={sale._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    {sale.movie_id && (
                      <div className="relative h-40 sm:h-48 bg-gray-200">
                        <img
                          src={getImageUrl(sale.movie_id?.image)}
                          alt={sale.movie_id?.title || "Movie poster"}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-movie.jpg")
                          }
                        />
                      </div>
                    )}
                    <div className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                        {sale.movie_id ? sale.movie_id.title : "Movie Ticket"}
                      </h3>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  
                        {/* Add seat information */}
                        <div>
                          <span className="font-medium">Seats:</span>{" "}
                          {formatSeats(sale.seats)}
                        </div>
                        {/* Add room information */}
                        {sale.room_id && (
                          <div>
                            <span className="font-medium">Room:</span>{" "}
                            {sale.room_id.name || "Unknown"}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Payment:</span>{" "}
                          {sale.payment_method}
                        </div>
                        {sale.menu_items && sale.menu_items.length > 0 && (
                          <div>
                            <span className="font-medium">Includes:</span>{" "}
                            Concessions
                          </div>
                        )}
                      </div>
                      <div className="mt-3 font-bold text-base sm:text-lg text-yellow-600">
                        Rs. {safeToFixed(sale.total_amount)}
                      </div>
                      <button
                        onClick={() => handleViewDetails(sale._id)}
                        className="mt-3 w-full inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-yellow-500 shadow-sm text-xs sm:text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
                      >
                        <FiEye className="mr-2" />
                        View Details
                      </button>
                    </div>
                    <div className="bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500">
                      {formatDate(sale.date) !== "Recent purchase"
                        ? `Purchased on ${formatDate(sale.date)}`
                        : "Recent purchase"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "concessions" && (
          <>
            {/* Concessions tab content remains unchanged */}
            {history.concessions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                <FiCoffee className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No concessions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't purchased any food or beverages yet.
                </p>
                <div className="mt-6">
                  <a
                    href="/menu"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
                  >
                    Browse Menu
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {history.concessions.map((sale) => (
                  <div
                    key={sale._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                          Concessions
                        </h3>
                        {sale.movie_id && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            With Movie
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 mb-4">
                        {sale.menu_items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded overflow-hidden">
                              <img
                                src={getImageUrl(item.menu_id?.image)}
                                alt={item.menu_id?.name || "Menu Item"}
                                className="h-full w-full object-cover"
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    "/placeholder-food.jpg")
                                }
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-xs sm:text-sm font-medium text-gray-900">
                                {item.menu_id?.name || "Unknown Item"}
                              </p>
                              <p className="text-xs text-gray-500">
                                x{item.quantity || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                        {sale.menu_items.length > 3 && (
                          <p className="text-xs sm:text-sm text-gray-500 italic">
                            +{sale.menu_items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Payment:</span>{" "}
                          {sale.payment_method}
                        </div>
                        <div>
                          <span className="font-medium">Total Items:</span>{" "}
                          {getTotalItems(sale.menu_items)}
                        </div>
                      </div>

                      <div className="mt-3 font-bold text-base sm:text-lg text-yellow-600">
                        Rs. {safeToFixed(sale.total_amount)}
                      </div>

                      <button
                        onClick={() => handleViewDetails(sale._id)}
                        className="mt-3 w-full inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-yellow-500 shadow-sm text-xs sm:text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
                      >
                        <FiEye className="mr-2" />
                        View Details
                      </button>
                    </div>
                    <div className="bg-yellow-50 px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500">
                      Purchased on {formatDate(sale.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl w-full max-w-xs sm:max-w-lg md:max-w-3xl max-h-[90vh] sm:max-h-[85vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Purchase Details
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-8rem)]">
              <div className="mb-4">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">
                  Purchase #
                  {selectedSale._id.substring(selectedSale._id.length - 6)}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900">
                  <span className="font-semibold">Date:</span>{" "}
                  {formatDate(selectedSale.date)}
                </div>
              </div>

              {/* Movie section */}
              {selectedSale.movie_id && (
                <div className="mb-6">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
                    Movie Ticket
                  </h4>
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 mb-4 sm:mb-0 sm:mr-4">
                      <img
                        src={getImageUrl(selectedSale.movie_id.image)}
                        alt={selectedSale.movie_id.title}
                        className="w-full h-32 sm:h-auto rounded-md object-cover"
                        onError={(e) =>
                          (e.currentTarget.src = "/placeholder-movie.jpg")
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                        {selectedSale.movie_id.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-3 sm:line-clamp-none">
                        {selectedSale.movie_id.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium">Duration:</span>{" "}
                          {selectedSale.movie_id.duration} min
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {selectedSale.movie_id.type}
                        </div>
                        {/* Add seat information to modal */}
                        <div>
                          <span className="font-medium">Seats:</span>{" "}
                          {formatSeats(selectedSale.seats)}
                        </div>
                        {/* Add room information to modal */}
                        {selectedSale.room_id && (
                          <div>
                            <span className="font-medium">Room:</span>{" "}
                            {selectedSale.room_id.name || "Unknown"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Concessions section */}
              {selectedSale.menu_items &&
                selectedSale.menu_items.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
                      Concessions
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {selectedSale.menu_items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 sm:h-14 sm:w-14 bg-gray-200 rounded overflow-hidden">
                              <img
                                src={getImageUrl(item.menu_id?.image)}
                                alt={item.menu_id?.name || "Menu Item"}
                                className="h-full w-full object-cover"
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    "/placeholder-food.jpg")
                                }
                              />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-900">
                                {item.menu_id?.name || "Unknown Item"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Rs. {safeToFixed(item.menu_id?.price)} each
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm text-gray-500 mr-3 sm:mr-4">
                              x{item.quantity || 0}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">
                              Rs. 
                              {safeToFixed(
                                (item.menu_id?.price || 0) *
                                  (item.quantity || 0)
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          Concessions Total:{" "}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          Rs. 
                          {safeToFixed(
                            calculateConcessionsTotal(selectedSale.menu_items)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Payment summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">
                  Payment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="text-gray-900 font-medium">
                      {selectedSale.payment_method}
                    </span>
                  </div>
                  {selectedSale.movie_id && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Movie Ticket</span>
                      <span className="text-gray-900 font-medium">
                        Rs. 
                        {safeToFixed(
                          selectedSale.total_amount -
                            calculateConcessionsTotal(selectedSale.menu_items)
                        )}
                      </span>
                    </div>
                  )}
                  {selectedSale.menu_items &&
                    selectedSale.menu_items.length > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Concessions</span>
                        <span className="text-gray-900 font-medium">
                          Rs. 
                          {safeToFixed(
                            calculateConcessionsTotal(selectedSale.menu_items)
                          )}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-sm sm:text-base font-bold pt-3 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-yellow-600">
                      Rs. {safeToFixed(selectedSale.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-yellow-50 border-t border-yellow-100 flex justify-end flex-wrap gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 flex items-center transition duration-150"
              >
                <FiPrinter className="mr-2" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;