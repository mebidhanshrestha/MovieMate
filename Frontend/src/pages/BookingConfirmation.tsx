import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface Movie {
  _id: string;
  title: string;
  price: number;
}

interface Showtime {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
}

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State to store menu items and movie details
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract state safely
  const { 
    selectedSeats, 
    showtimeId, 
    movieId, 
    roomId, 
    date, 
    selectedItems
  }: {
    selectedSeats?: string[];
    showtimeId?: string;
    movieId?: string;
    roomId?: string;
    date?: string;
    selectedItems?: { [key: string]: number };
  } = location.state || {};

  // Fetch menu items and movie details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch menu items
        const menuResponse = await axios.get('http://localhost:3001/api/menu');
        setMenuItems(menuResponse.data);
        
        // Fetch movie details if movieId exists
        if (movieId) {
          const movieResponse = await axios.get(`http://localhost:3001/api/movie/${movieId}`);
          setMovie(movieResponse.data.movie);
        }
        
        // Fetch showtime details if showtimeId and roomId exist
        if (showtimeId && roomId) {
          const roomResponse = await axios.get(`http://localhost:3001/api/room/${roomId}/showtimes`);
          const showtimes = roomResponse.data.showtimes;
          // Find the specific showtime by its ID
          const selectedShowtime = showtimes.find((st: Showtime) => st._id === showtimeId);
          if (selectedShowtime) {
            setShowtime(selectedShowtime);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId, showtimeId, roomId]);

  // Get menu item details by ID
  const getMenuItemById = (id: string) => {
    return menuItems.find(item => item._id === id) || { name: "Unknown Item", price: 0 };
  };

  // Get the ticket price from the movie
  const getTicketPrice = (): number => {
    return movie?.price || 0;
  };

  // Calculate total price of menu items
  const calculateMenuItemsTotal = (): number => {
    if (!selectedItems) return 0;
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = getMenuItemById(itemId);
      return total + (item.price * (quantity as number));
    }, 0);
  };

  // Calculate total price including ticket and menu items
  const calculateTotalPrice = (): number => {
    const ticketPrice = getTicketPrice();
    const ticketTotal = ticketPrice * (selectedSeats?.length || 0);
    const menuItemsTotal = calculateMenuItemsTotal();
    return ticketTotal + menuItemsTotal;
  };

  const handleConfirmBooking = () => {
    // Prepare menu items for backend
    const preparedMenuItems = Object.entries(selectedItems || {}).map(([menu_id, quantity]) => ({
      menu_id,
      quantity: quantity as number
    }));
  
    const totalPrice = calculateTotalPrice();
  
    axios.post("http://localhost:3001/api/bookings", {
      user_id: localStorage.getItem("id"),
      movie_id: movieId,
      room_id: roomId,
      date: Date.now(),
      time_slot: showtimeId,
      seats: selectedSeats,
      menu_items: preparedMenuItems,
      payment_method: "card",
      total_price: totalPrice,
      status: "confirmed"
    })
    .then((response) => {
      console.log('Booking created:', response.data);
      alert("Booking confirmed!");
      navigate("/");
    })
    .catch(error => {
      console.error("Error confirming booking:", error.response?.data || error.message);
      alert(`Failed to confirm booking: ${error.response?.data?.message || error.message}`);
    });
  };

  // Format the date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Today";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Today";
      }
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Today";
    }
  };

  // Render loading state if needed
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{borderColor: "#FBC700"}}></div>
      </div>
    );
  }

  if (!location.state || !movie) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div style={{backgroundColor: "#fff5d7"}} className="border p-4 rounded-lg shadow-md border-yellow-400">
          <p className="text-gray-800">Unable to load booking details. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden" style={{borderTop: "8px solid #FBC700"}}>
        {/* Header Section */}
        <div className="p-4 sm:p-6 text-center border-b">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{color: "#e3b400"}}>Booking Confirmation</h2>
          <p className="text-gray-500 text-sm sm:text-base">Please review your order details</p>
        </div>
        
        {/* Content Section */}
        <div className="p-4 sm:p-6">
          {/* Movie Details */}
          <div className="mb-6">
            <div className="flex items-start">
              <div className="rounded-full p-3 mr-4 flex-shrink-0" style={{backgroundColor: "#FBC700"}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Movie</h3>
                <p className="text-xl font-bold">{movie.title}</p>
              </div>
            </div>
          </div>
          
          {/* Date & Time */}
          <div className="mb-6">
            <div className="flex items-start">
              <div className="rounded-full p-3 mr-4 flex-shrink-0" style={{backgroundColor: "#FBC700"}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Date & Time</h3>
                <p className="text-gray-600">{showtime ? formatDate(showtime.date) : formatDate(date)}</p>
                <p className="text-gray-800 font-medium">
                  {showtime ? `${showtime.start_time} - ${showtime.end_time}` : "Time not available"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Seats */}
          <div className="mb-6">
            <div className="flex items-start">
              <div className="rounded-full p-3 mr-4 flex-shrink-0" style={{backgroundColor: "#FBC700"}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Selected Seats</h3>
                <div className="flex flex-wrap mt-2">
                  {selectedSeats?.map((seat) => (
                    <span 
                      key={seat} 
                      className="inline-block px-3 py-1 mr-2 mb-2 rounded-full text-sm font-medium"
                      style={{backgroundColor: "#fff5d7", color: "#e3b400"}}
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Snacks - Redesigned */}
          {selectedItems && Object.keys(selectedItems).length > 0 && (
            <div className="mb-6">
              <div className="flex items-start">
                <div className="rounded-full p-3 mr-4 flex-shrink-0" style={{backgroundColor: "#FBC700"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Selected Snacks</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedItems).map(([itemId, quantity]) => {
                      const item = getMenuItemById(itemId);
                      return (
                        <div key={itemId} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                              <span className="font-medium" style={{color: "#e3b400"}}>{quantity}</span>
                            </div>
                            <span className="text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-800">Rs. {(item.price * (quantity as number)).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="mt-8 rounded-xl p-4" style={{backgroundColor: "#fff5d7"}}>
            <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
              <span className="text-gray-600">Ticket Price:</span>
              <span className="font-medium">Rs. {getTicketPrice().toFixed(2)} × {selectedSeats?.length}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
              <span className="text-gray-600">Ticket Total:</span>
              <span className="font-medium">Rs. {(getTicketPrice() * (selectedSeats?.length || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
              <span className="text-gray-600">Menu Items Total:</span>
              <span className="font-medium">Rs. {calculateMenuItemsTotal().toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-300 my-3"></div>
            <div className="flex justify-between items-center text-base sm:text-lg">
              <span className="font-bold">Total Price:</span>
              <span className="font-bold" style={{color: "#e3b400"}}>Rs. {calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer/Button Section */}
        <div className="px-4 pb-6 sm:px-6">
          <button
            className="w-full py-3 sm:py-4 rounded-lg font-bold text-white transition duration-300 transform hover:scale-105"
            style={{backgroundColor: "#FBC700", boxShadow: "0 4px 12px rgba(251, 199, 0, 0.3)"}}
            onClick={handleConfirmBooking}
          >
            <div className="flex justify-center items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirm Booking
            </div>
          </button>
          <div className="text-center mt-4">
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;