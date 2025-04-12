import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  User,
  Coffee,
  CreditCard,
  Download,
} from "lucide-react";

interface MenuItem {
  menu_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Showtime {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  movie_id?: string;
  seats?: any[];
}

interface Room {
  _id: string;
  name: string;
  total_seats: number;
  showtimes: Showtime[];
}

interface Movie {
  _id: string;
  title: string;
  price: number;
  duration: number;
  image: string;
}

interface TicketReceipt {
  bookingId: string;
  movieTitle: string;
  date: string;
  time: string;
  room: string;
  seats: string[];
  totalPrice: number;
  referenceId: string;
  menuItems?: MenuItem[];
  loyaltyPointsEarned: number;
}

const EsewaSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [ticketReceipt, setTicketReceipt] = useState<TicketReceipt | null>(
    null
  );
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [showtime, setShowtime] = useState<Showtime | null>(null);

  // Add a custom CSS for print-only content
  useEffect(() => {
    // Create a style element
    const style = document.createElement("style");

    // Define print styles
    style.innerHTML = `
      @media print {
  /* Hide everything */
  body * {
    display: none;
  }
  
  /* Only show the ticket receipt and all its children */
  #ticket-receipt, 
  #ticket-receipt * {
    display: block !important;
    visibility: visible !important;
  }
  
  /* Hide buttons inside the receipt when printing */
  #ticket-receipt button,
  #ticket-receipt .print-hide {
    display: none !important;
  }
  
  /* Set margin for the printed page */
  @page {
    margin: 0.5cm;
  }
}
    `;

    // Append to head
    document.head.appendChild(style);

    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const completeBooking = async () => {
      try {
        // Log all available data for debugging
        console.log("URL Search params:", location.search);
        console.log(
          "Local storage pendingBooking:",
          localStorage.getItem("pendingBooking")
        );

        // Parse URL parameters
        const searchParams = new URLSearchParams(location.search);
        const oid = searchParams.get("oid"); // Order ID
        const amt = searchParams.get("amt"); // Amount
        const refId = searchParams.get("refId"); // Reference ID

        // For testing purposes, generate a mock refId if it's missing
        const referenceId = refId || `TEST_REF_${Date.now()}`;

        // Get pending booking from localStorage
        const pendingBookingData = localStorage.getItem("pendingBooking");
        if (!pendingBookingData) {
          console.error("No pending booking data found in localStorage");
          setError(
            "Booking information not found. Please try again or contact support."
          );
          setLoading(false);
          return;
        }

        const pendingBooking = JSON.parse(pendingBookingData);
        setBookingDetails(pendingBooking);

        // Proceed with creating booking
        try {
          // Format booking data to match backend expectations
          const bookingData = {
            user_id: pendingBooking.user_id,
            movie_id: pendingBooking.movie_id,
            room_id: pendingBooking.room_id,
            date: pendingBooking.date,
            time_slot: pendingBooking.time_slot,
            seats: pendingBooking.seats,
            menu_items: pendingBooking.menu_items,
            payment_method: "esewa",
            total_price: pendingBooking.total_price,
            transaction_id: pendingBooking.transaction_id,
            esewa_token: referenceId,
            status: "confirmed",
          };

          console.log("Sending booking data to create booking:", bookingData);

          // Create the booking in the database
          const bookingResponse = await axios.post(
            "http://localhost:3001/api/booking-management/booking/movie-book",
            bookingData
          );

          console.log("Booking confirmed:", bookingResponse.data);

          // Get booking ID from response
          const newBookingId =
            bookingResponse.data.bookingId ||
            bookingResponse.data._id ||
            bookingResponse.data.data?._id ||
            bookingResponse.data.booking?._id ||
            "Unknown";

          // Initialize variables to store fetched data
          let movieDetails: Movie | null = null;
          let roomDetails: Room | null = null;
          let showtimeDetails: Showtime | null = null;
          let menuItemsDetails: any[] = [];
          let roomName = "Theater Room"; // Default room name

          // 1. FETCH ROOM DETAILS - This contains the room name and showtimes array
          // Update this section in your EsewaSuccess component:

// Replace the room fetching section in your EsewaSuccess component:

// 1. FETCH ROOM DETAILS - This contains the room name and showtimes array
try {
  console.log(`Fetching room details for room ID: ${pendingBooking.room_id}`);
  
  // Make sure room_id exists and isn't undefined
  if (!pendingBooking.room_id) {
    console.error("Room ID is missing from pending booking data");
    throw new Error("Room ID is required");
  }
  
  // Use POST request with room_id in the body
  const roomResponse = await axios.post(
    `http://localhost:3001/api/room/therater`,
    { room_id: pendingBooking.room_id } // Send room_id in request body
  );

  console.log("Room API full response:", roomResponse);

  // Check if response has the expected structure
  if (roomResponse.data && roomResponse.data.success && roomResponse.data.room) {
    roomDetails = roomResponse.data.room;
    
    // Extract room name directly from the room object
    roomName = roomDetails.name || "Theater Room";
    console.log("Room details:", roomDetails);
    console.log("Room name extracted:", roomName);
    
    // Extract the showtime from the room's showtimes array using time_slot
    if (roomDetails.showtimes && roomDetails.showtimes.length > 0) {
      console.log("Showtimes array:", roomDetails.showtimes);
      console.log("Looking for time_slot ID:", pendingBooking.time_slot);
      
      // Find the showtime that matches the time_slot ID
      const matchedShowtime = roomDetails.showtimes.find(
        (st) => st._id === pendingBooking.time_slot
      );
      
      if (matchedShowtime) {
        showtimeDetails = matchedShowtime;
        setShowtime(matchedShowtime);
        console.log("Found showtime in room details:", showtimeDetails);
      } else {
        console.log("No matching showtime found in room.showtimes array");
      }
    } else {
      console.log("Room has no showtimes array or it's empty");
    }
  } else {
    console.log("Room details not properly structured in response:", roomResponse.data);
  }
} catch (roomError) {
  console.error("Error fetching room details:", roomError);
  // Continue with other fallback methods to get the data
}

          // If showtime wasn't found in room details, try alternative methods
          if (!showtimeDetails) {
            try {
              // Try direct showtime endpoint if it exists
              console.log(
                `Trying to fetch showtime directly with ID: ${pendingBooking.time_slot}`
              );
              const showtimeResponse = await axios.get(
                `http://localhost:3001/api/showtime/${pendingBooking.time_slot}`
              );

              if (showtimeResponse.data && showtimeResponse.data.showtime) {
                showtimeDetails = showtimeResponse.data.showtime;
                setShowtime(showtimeDetails);
                console.log(
                  "Showtime details from direct API:",
                  showtimeDetails
                );
              }
            } catch (showtimeError) {
              console.log("Direct showtime API not available", showtimeError);

              // Try the room/showtimes endpoint
              try {
                console.log(
                  `Trying room/showtimes endpoint for room: ${pendingBooking.room_id}`
                );
                const roomShowtimesResponse = await axios.get(
                  `http://localhost:3001/api/room/${pendingBooking.room_id}/showtimes`
                );

                if (
                  roomShowtimesResponse.data &&
                  roomShowtimesResponse.data.showtimes
                ) {
                  const showtimes = roomShowtimesResponse.data.showtimes;
                  const matchedShowtime = showtimes.find(
                    (st: Showtime) => st._id === pendingBooking.time_slot
                  );

                  if (matchedShowtime) {
                    showtimeDetails = matchedShowtime;
                    setShowtime(matchedShowtime);
                    console.log(
                      "Found showtime in room/showtimes API:",
                      showtimeDetails
                    );
                  }
                }
              } catch (roomShowtimesError) {
                console.log("Room showtimes API error:", roomShowtimesError);
              }
            }
          }

          // 2. FETCH MOVIE DETAILS
          try {
            console.log(
              `Fetching movie details for movie ID: ${pendingBooking.movie_id}`
            );
            const movieResponse = await axios.get(
              `http://localhost:3001/api/movie/${pendingBooking.movie_id}`
            );

            if (
              movieResponse.data &&
              (movieResponse.data.movie || movieResponse.data.success)
            ) {
              movieDetails =
                movieResponse.data.movie || movieResponse.data.data;
              console.log("Movie details:", movieDetails);
            }
          } catch (movieError) {
            console.error("Error fetching movie details:", movieError);
          }

          // 3. FETCH MENU ITEM DETAILS for each item in the order
          try {
            if (
              pendingBooking.menu_items &&
              pendingBooking.menu_items.length > 0
            ) {
              console.log("Fetching details for menu items");

              // Fetch all menu items first
              const menuResponse = await axios.get(
                "http://localhost:3001/api/menu"
              );
              const allMenuItems = menuResponse.data || [];

              // Map through the ordered items and add details from the fetched menu items
              menuItemsDetails = pendingBooking.menu_items.map((item: any) => {
                const menuItemDetails =
                  allMenuItems.find(
                    (menuItem: any) => menuItem._id === item.menu_id
                  ) || {};

                return {
                  menu_id: item.menu_id,
                  name: menuItemDetails.name || item.name || "Food Item",
                  quantity: item.quantity,
                  price: menuItemDetails.price || item.price || 0,
                };
              });

              console.log("Menu items with details:", menuItemsDetails);
            }
          } catch (menuError) {
            console.error("Error fetching menu items:", menuError);
            // Fallback to the original menu items without detailed info
            menuItemsDetails = pendingBooking.menu_items.map((item: any) => ({
              menu_id: item.menu_id,
              name: item.name || "Food Item",
              quantity: item.quantity,
              price: item.price || 0,
            }));
          }

          // 4. UPDATE LOYALTY POINTS
          let loyaltyPointsEarned = 0;
          try {
            // Calculate loyalty points - 1 point for every 100 spent
            loyaltyPointsEarned = Math.floor(pendingBooking.total_price / 100);
            setPointsEarned(loyaltyPointsEarned);

            if (loyaltyPointsEarned > 0) {
              // First check if the user has existing loyalty points
              try {
                const checkPointsResponse = await axios.get(
                  `http://localhost:3001/api/loyalty-points/user/${pendingBooking.user_id}`
                );

                if (checkPointsResponse.status === 200) {
                  // User has existing points, update them
                  await axios.put(
                    `http://localhost:3001/api/loyalty-points/user/${pendingBooking.user_id}`,
                    {
                      points:
                        checkPointsResponse.data.data.points +
                        loyaltyPointsEarned,
                    }
                  );
                  console.log(
                    `Added ${loyaltyPointsEarned} loyalty points to user account`
                  );
                }
              } catch (pointsError: any) {
                // If error status is 404, user doesn't have loyalty points record yet
                if (pointsError.response?.status === 404) {
                  try {
                    // Create new loyalty points record for user
                    await axios.post(
                      "http://localhost:3001/api/loyalty-points",
                      {
                        user_id: pendingBooking.user_id,
                        points: loyaltyPointsEarned,
                      }
                    );
                    console.log(
                      `Created loyalty points account with ${loyaltyPointsEarned} points`
                    );
                  } catch (createPointsError) {
                    console.error(
                      "Error creating loyalty points:",
                      createPointsError
                    );
                  }
                } else {
                  console.error("Error updating loyalty points:", pointsError);
                }
              }
            }
          } catch (loyaltyError) {
            console.error("Error handling loyalty points:", loyaltyError);
          }

          // 5. BUILD THE TICKET RECEIPT with all the collected data

          // Extract movie title with fallbacks
          const movieTitle =
            movieDetails?.title || pendingBooking.movie_title || "Movie";

          // Format the date and time with a clear priority order
          let formattedDate = new Date().toISOString(); // Default to today
          let timeDisplay = "Time not available";

          // Priority 1: Use showtime data from the fetched room details
          if (showtimeDetails) {
            formattedDate = showtimeDetails.date;
            timeDisplay = `${showtimeDetails.start_time} - ${showtimeDetails.end_time}`;
            console.log(
              "Using showtime details from room:",
              formattedDate,
              timeDisplay
            );
          }
          // Priority 2: Use showtime state if available
          else if (showtime) {
            formattedDate = showtime.date;
            timeDisplay = `${showtime.start_time} - ${showtime.end_time}`;
            console.log(
              "Using showtime state data:",
              formattedDate,
              timeDisplay
            );
          }
          // Priority 3: Use pending booking time_display field if available
          else if (pendingBooking.time_display) {
            timeDisplay = pendingBooking.time_display;
            formattedDate = pendingBooking.date || new Date().toISOString();
            console.log(
              "Using pending booking time_display:",
              formattedDate,
              timeDisplay
            );
          }
          // Priority 4: Use individual start/end time fields if available
          else if (pendingBooking.start_time && pendingBooking.end_time) {
            timeDisplay = `${pendingBooking.start_time} - ${pendingBooking.end_time}`;
            formattedDate = pendingBooking.date || new Date().toISOString();
            console.log(
              "Using pending booking start/end time:",
              formattedDate,
              timeDisplay
            );
          }

          // Use the room name we extracted earlier
          const finalRoomName =
            roomName || pendingBooking.roomName || "Theater Room";
          console.log("Final room name for ticket:", finalRoomName);

          // Create the final ticket receipt object
          const receipt: TicketReceipt = {
            bookingId: newBookingId,
            movieTitle: movieTitle,
            date: formattedDate,
            time: timeDisplay,
            room: finalRoomName,
            seats: pendingBooking.seats,
            totalPrice: pendingBooking.total_price,
            referenceId: referenceId,
            menuItems:
              menuItemsDetails.length > 0
                ? menuItemsDetails
                : pendingBooking.menu_items,
            loyaltyPointsEarned: loyaltyPointsEarned,
          };

          console.log("Final ticket receipt data:", receipt);
          setTicketReceipt(receipt);
          setLoading(false);

          // Clear the pending booking data
          localStorage.removeItem("pendingBooking");
        } catch (bookingError: any) {
          console.error("Error creating booking:", bookingError);
          console.error("Booking error details:", bookingError.response?.data);

          setError(
            "There was an error creating your booking. Please contact support."
          );
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Error in EsewaSuccess:", error);
        console.error("Error details:", error.response?.data);
        setError(
          "There was a problem completing your booking. Please contact support."
        );
        setLoading(false);
      }
    };

    completeBooking();
  }, [location, navigate]);

  const handleGoHome = () => {
    navigate("/", {
      state: {
        bookingSuccess: true,
        message: "Your booking has been successfully confirmed!",
      },
    });
  };

  const handlePrintTicket = () => {
    window.print();
  };

  // Improved formatDate function to handle various formats
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Today";

    try {
      // Handle various date formats - timestamp (number), ISO string, or date string
      let date;
      if (typeof dateString === "number") {
        date = new Date(dateString);
      } else if (!isNaN(Date.parse(dateString))) {
        date = new Date(dateString);
      } else {
        // If dateString is not a valid date format, use current date
        console.log("Invalid date format:", dateString);
        return "Today";
      }

      // Verify the date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date:", dateString);
        return "Today";
      }

      // Format date consistently with the BookingConfirmation component
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, "Input:", dateString);
      return "Today";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#FBC700" }}
          ></div>
          <h2 className="text-xl font-bold mb-2">Processing Booking...</h2>
          <p className="text-gray-600">Please do not close this window</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-8 text-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Booking Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (ticketReceipt) {
    return (
      <div className="container mx-auto p-4 sm:p-8 md:py-12 print-hide">
        {/* Success banner - hide when printing */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-8 print-hide">
          <svg
            className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-700">Your booking has been confirmed.</p>

          {pointsEarned > 0 && (
            <div className="mt-4 flex items-center justify-center gap-x-2 text-primary">
              <Award className="h-5 w-5" />
              <p className="font-medium">
                You earned {pointsEarned} loyalty points!
              </p>
            </div>
          )}
        </div>

        {/* Separate printable receipt */}
        <div id="print-receipt" className="hidden fixed top-0 left-0 w-full">
          <div className="bg-white p-4">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">MovieMate</h1>
              <p className="text-sm text-gray-500">
                {formatDate(new Date().toString())}
              </p>
            </div>

            <div className="mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold mb-2">Movie Ticket</h2>
              <h3 className="text-lg mb-2">{ticketReceipt.movieTitle}</h3>

              <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">
                    {formatDate(ticketReceipt.date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium">{ticketReceipt.time}</p>
                </div>
                <div>
                  <p className="text-gray-500">Room</p>
                  <p className="font-medium">{ticketReceipt.room}</p>
                </div>
                <div>
                  <p className="text-gray-500">Seats</p>
                  <p className="font-medium">
                    {ticketReceipt.seats.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {ticketReceipt.menuItems && ticketReceipt.menuItems.length > 0 && (
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h3 className="font-bold mb-2">Food & Beverages</h3>
                <div className="space-y-1">
                  {ticketReceipt.menuItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity} × {item.name || `Item ${index + 1}`}
                      </span>
                      <span className="font-medium">
                        Rs. {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 border-b border-gray-200 pb-4">
              <h3 className="font-bold mb-2">Payment Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">eSewa</p>
                </div>
                <div>
                  <p className="text-gray-500">Reference ID</p>
                  <p className="font-medium break-all">
                    {ticketReceipt.referenceId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Booking ID</p>
                  <p className="font-medium">#{ticketReceipt.bookingId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-medium">
                    Rs. {ticketReceipt.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {ticketReceipt.loyaltyPointsEarned > 0 && (
              <div className="mb-6 border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <h3 className="font-bold">Loyalty Points Earned</h3>
                  <span className="font-bold">
                    +{ticketReceipt.loyaltyPointsEarned}
                  </span>
                </div>
              </div>
            )}

            <div className="text-center mt-6">
              <p className="text-sm">Please show this ticket at the entrance</p>
              <p className="text-xs mt-4">Thank you for choosing MovieMate!</p>
            </div>
          </div>
        </div>

        {/* Visual receipt (not for printing) */}
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-3xl mx-auto"
          style={{ borderTop: "8px solid #FBC700" }}
          id="ticket-receipt"
        >
          {/* Ticket Header */}
          <div className="p-4 sm:p-6 text-center border-b">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-1"
              style={{ color: "#e3b400" }}
            >
              Booking Confirmation
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Your order has been successfully placed
            </p>
          </div>

          {/* Movie Details */}
          <div className="p-4 sm:p-6">
            <div className="mb-6">
              <div className="flex items-start">
                <div
                  className="rounded-full p-3 mr-4 flex-shrink-0"
                  style={{ backgroundColor: "#FBC700" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h18M3 16h18"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Movie</h3>
                  <p className="text-xl font-bold">
                    {ticketReceipt.movieTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="mb-6">
              <div className="flex items-start">
                <div
                  className="rounded-full p-3 mr-4 flex-shrink-0"
                  style={{ backgroundColor: "#FBC700" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Date & Time</h3>
                  <p className="text-gray-600">
                    {formatDate(ticketReceipt.date)}
                  </p>
                  <p className="text-gray-800 font-medium">
                    {ticketReceipt.time}
                  </p>
                </div>
              </div>
            </div>

            {/* Room */}
            <div className="mb-6">
              <div className="flex items-start">
                <div
                  className="rounded-full p-3 mr-4 flex-shrink-0"
                  style={{ backgroundColor: "#FBC700" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Room</h3>
                  <p className="text-gray-800 font-medium">
                    {ticketReceipt.room}
                  </p>
                </div>
              </div>
            </div>

            {/* Seats */}
            <div className="mb-6">
              <div className="flex items-start">
                <div
                  className="rounded-full p-3 mr-4 flex-shrink-0"
                  style={{ backgroundColor: "#FBC700" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Selected Seats</h3>
                  <div className="flex flex-wrap mt-2">
                    {ticketReceipt.seats.map((seat) => (
                      <span
                        key={seat}
                        className="inline-block px-3 py-1 mr-2 mb-2 rounded-full text-sm font-medium"
                        style={{ backgroundColor: "#fff5d7", color: "#e3b400" }}
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items Section */}
            {ticketReceipt.menuItems && ticketReceipt.menuItems.length > 0 && (
              <div className="mb-6">
                <div className="flex items-start">
                  <div
                    className="rounded-full p-3 mr-4 flex-shrink-0"
                    style={{ backgroundColor: "#FBC700" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      Selected Snacks
                    </h3>
                    <div className="space-y-3">
                      {ticketReceipt.menuItems.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                              <span
                                className="font-medium"
                                style={{ color: "#e3b400" }}
                              >
                                {item.quantity}
                              </span>
                            </div>
                            <span className="text-gray-800">
                              {item.name || `Item ${index + 1}`}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">
                            Rs. {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="mb-6">
              <div className="flex items-start">
                <div
                  className="rounded-full p-3 mr-4 flex-shrink-0"
                  style={{ backgroundColor: "#FBC700" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Payment Information</h3>
                  <p className="text-gray-600">
                    Payment Method: <span className="font-medium">eSewa</span>
                  </p>
                  <p className="text-gray-600">
                    Reference ID:{" "}
                    <span className="font-medium">
                      {ticketReceipt.referenceId}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Booking ID:{" "}
                    <span className="font-medium">
                      #{ticketReceipt.bookingId}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div
              className="mt-8 rounded-xl p-4"
              style={{ backgroundColor: "#fff5d7" }}
            >
              <div className="flex justify-between items-center mb-2 text-base">
                <span className="font-bold">Total Price:</span>
                <span className="font-bold" style={{ color: "#e3b400" }}>
                  Rs. {ticketReceipt.totalPrice.toFixed(2)}
                </span>
              </div>

              {ticketReceipt.loyaltyPointsEarned > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-yellow-200 mt-2">
                  <span className="text-gray-600">Loyalty Points Earned:</span>
                  <span className="font-medium text-green-600">
                    +{ticketReceipt.loyaltyPointsEarned} points
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer/Button Section */}
          <div className="px-4 pb-6 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handlePrintTicket}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Print Ticket</span>
              </button>
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: "#FBC700",
                  boxShadow: "0 4px 12px rgba(251, 199, 0, 0.3)",
                }}
              >
                Continue to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 text-center">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
        <svg
          className="h-16 w-16 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-700">Your booking is being processed...</p>
        <p className="text-gray-600 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default EsewaSuccess;
