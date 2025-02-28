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
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

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

// Move formatDate outside the component
const formatDate = (dateString?: string) => {
  if (!dateString) return "Today";

  try {
    let date;
    if (typeof dateString === "number") {
      date = new Date(dateString);
    } else if (!isNaN(Date.parse(dateString))) {
      date = new Date(dateString);
    } else {
      console.log("Invalid date format:", dateString);
      return "Today";
    }

    if (isNaN(date.getTime())) {
      console.log("Invalid date:", dateString);
      return "Today";
    }

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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    color: "#e3b400",
  },
  section: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detail: {
    fontSize: 12,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  total: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e3b400",
    marginTop: 20,
    textAlign: "right",
  },
});

const TicketPDF = ({ ticketReceipt }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>MovieMate Booking Confirmation</Text>

      <View style={styles.section}>
        <Text style={styles.title}>Movie Ticket</Text>
        <Text style={styles.detail}>Movie: {ticketReceipt.movieTitle}</Text>
        <Text style={styles.detail}>
          Date: {formatDate(ticketReceipt.date)}
        </Text>
        <Text style={styles.detail}>Time: {ticketReceipt.time}</Text>
        <Text style={styles.detail}>Room: {ticketReceipt.room}</Text>
        <Text style={styles.detail}>
          Seats: {ticketReceipt.seats.join(", ")}
        </Text>
      </View>

      {ticketReceipt.menuItems && ticketReceipt.menuItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Food & Beverages</Text>
          {ticketReceipt.menuItems.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text>
                {item.quantity} x {item.name || `Item ${index + 1}`}
              </Text>
              <Text style={styles.bold}>
                Rs. {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.title}>Payment Information</Text>
        <Text style={styles.detail}>Payment Method: eSewa</Text>
        <Text style={styles.detail}>
          Reference ID: {ticketReceipt.referenceId}
        </Text>
        <Text style={styles.detail}>
          Booking ID: #{ticketReceipt.bookingId}
        </Text>
        <Text style={styles.detail}>
          Total Amount: Rs. {ticketReceipt.totalPrice.toFixed(2)}
        </Text>
      </View>

      {ticketReceipt.loyaltyPointsEarned > 0 && (
        <View style={styles.section}>
          <Text style={[styles.row, { justifyContent: "space-between" }]}>
            <Text style={styles.bold}>Loyalty Points Earned:</Text>
            <Text style={styles.bold}>
              +{ticketReceipt.loyaltyPointsEarned}
            </Text>
          </Text>
        </View>
      )}

      <Text style={styles.total}>Thank you for choosing MovieMate!</Text>
    </Page>
  </Document>
);

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
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          display: none;
        }
        #ticket-receipt, #ticket-receipt * {
          display: block !important;
          visibility: visible !important;
        }
        #ticket-receipt button, #ticket-receipt .print-hide {
          display: none !important;
        }
        @page {
          margin: 0.5cm;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Send email receipt
  const sendEmailReceipt = async () => {
    if (!ticketReceipt || emailSent || emailSending) return;

    try {
      setEmailSending(true);
      setEmailError(null);

      // Instead of getting data from localStorage, use the bookingDetails state
      // which was already set earlier in the component lifecycle
      if (!bookingDetails || !bookingDetails.user_id) {
        throw new Error("User information not found");
      }

      const userId = bookingDetails.user_id;

      // Get user email
      try {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`
        );
        if (!userResponse.data || !userResponse.data.email) {
          throw new Error("User email not found");
        }

        const userEmail = userResponse.data.email;
        const userName = userResponse.data.name;

        // Send email with receipt details
        const emailResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/send-ticket-receipt`,
          {
            userEmail,
            userName,
            receipt: ticketReceipt,
          }
        );

        if (emailResponse.data.success) {
          setEmailSent(true);
          console.log("Email receipt sent successfully");
        } else {
          throw new Error(emailResponse.data.message || "Failed to send email");
        }
      } catch (userError) {
        console.error("Error getting user details:", userError);
        throw new Error("Could not retrieve user email information");
      }
    } catch (error: any) {
      console.error("Error sending email receipt:", error);
      setEmailError(error.message || "Failed to send email receipt");
    } finally {
      setEmailSending(false);
    }
  };

  // Trigger email sending when receipt is ready
  useEffect(() => {
    if (ticketReceipt && !emailSent && !emailSending && !emailError) {
      sendEmailReceipt();
    }
  }, [ticketReceipt]);

  useEffect(() => {
    const completeBooking = async () => {
      try {
        console.log("URL Search params:", location.search);
        console.log(
          "Local storage pendingBooking:",
          localStorage.getItem("pendingBooking")
        );

        const searchParams = new URLSearchParams(location.search);
        const oid = searchParams.get("oid");
        const amt = searchParams.get("amt");
        const refId = searchParams.get("refId");

        const referenceId = refId || `TEST_REF_${Date.now()}`;

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

        const bookingResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/booking-management/booking/movie-book`,
          bookingData
        );

        console.log("Booking confirmed:", bookingResponse.data);

        const newBookingId =
          bookingResponse.data.bookingId ||
          bookingResponse.data._id ||
          bookingResponse.data.data?._id ||
          bookingResponse.data.booking?._id ||
          "Unknown";

        let movieDetails: Movie | null = null;
        let roomDetails: Room | null = null;
        let showtimeDetails: Showtime | null = null;
        let menuItemsDetails: any[] = [];
        let roomName = "Theater Room";

        try {
          if (!pendingBooking.room_id) {
            console.error("Room ID is missing from pending booking data");
            throw new Error("Room ID is required");
          }

          const roomResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/room/therater`,
            { room_id: pendingBooking.room_id }
          );

          console.log("Room API full response:", roomResponse);

          if (
            roomResponse.data &&
            roomResponse.data.success &&
            roomResponse.data.room
          ) {
            roomDetails = roomResponse.data.room;
            roomName = roomDetails.name || "Theater Room";
            console.log("Room details:", roomDetails);
            console.log("Room name extracted:", roomName);

            if (roomDetails.showtimes && roomDetails.showtimes.length > 0) {
              console.log("Showtimes array:", roomDetails.showtimes);
              console.log(
                "Looking for time_slot ID:",
                pendingBooking.time_slot
              );

              const matchedShowtime = roomDetails.showtimes.find(
                (st) => st._id === pendingBooking.time_slot
              );

              if (matchedShowtime) {
                showtimeDetails = matchedShowtime;
                setShowtime(matchedShowtime);
                console.log("Found showtime in room details:", showtimeDetails);
              } else {
                console.log(
                  "No matching showtime found in room.showtimes array"
                );
              }
            } else {
              console.log("Room has no showtimes array or it's empty");
            }
          } else {
            console.log(
              "Room details not properly structured in response:",
              roomResponse.data
            );
          }
        } catch (roomError) {
          console.error("Error fetching room details:", roomError);
        }

        if (!showtimeDetails) {
          try {
            console.log(
              `Trying to fetch showtime directly with ID: ${pendingBooking.time_slot}`
            );
            const showtimeResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/showtime/${pendingBooking.time_slot}`
            );

            if (showtimeResponse.data && showtimeResponse.data.showtime) {
              showtimeDetails = showtimeResponse.data.showtime;
              setShowtime(showtimeDetails);
              console.log("Showtime details from direct API:", showtimeDetails);
            }
          } catch (showtimeError) {
            console.log("Direct showtime API not available", showtimeError);

            try {
              console.log(
                `Trying room/showtimes endpoint for room: ${pendingBooking.room_id}`
              );
              const roomShowtimesResponse = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/room/${pendingBooking.room_id}/showtimes`
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

        try {
          console.log(
            `Fetching movie details for movie ID: ${pendingBooking.movie_id}`
          );
          const movieResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/movie/${pendingBooking.movie_id}`
          );

          if (
            movieResponse.data &&
            (movieResponse.data.movie || movieResponse.data.success)
          ) {
            movieDetails = movieResponse.data.movie || movieResponse.data.data;
            console.log("Movie details:", movieDetails);
          }
        } catch (movieError) {
          console.error("Error fetching movie details:", movieError);
        }

        try {
          if (
            pendingBooking.menu_items &&
            pendingBooking.menu_items.length > 0
          ) {
            console.log("Fetching details for menu items");

            const menuResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/menu`
            );
            const allMenuItems = menuResponse.data || [];

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
          menuItemsDetails = pendingBooking.menu_items.map((item: any) => ({
            menu_id: item.menu_id,
            name: item.name || "Food Item",
            quantity: item.quantity,
            price: item.price || 0,
          }));
        }

        let loyaltyPointsEarned = 0;
        try {
          loyaltyPointsEarned = Math.floor(pendingBooking.total_price / 100);
          setPointsEarned(loyaltyPointsEarned);

          if (loyaltyPointsEarned > 0) {
            try {
              const checkPointsResponse = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points/user/${pendingBooking.user_id}`
              );

              if (checkPointsResponse.status === 200) {
                await axios.put(
                  `${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points/user/${pendingBooking.user_id}`,
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
              if (pointsError.response?.status === 404) {
                try {
                  await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points`, {
                    user_id: pendingBooking.user_id,
                    points: loyaltyPointsEarned,
                  });
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

        let formattedDate = new Date().toISOString();
        let timeDisplay = "Time not available";

        if (showtimeDetails) {
          formattedDate = showtimeDetails.date;
          timeDisplay = `${showtimeDetails.start_time} - ${showtimeDetails.end_time}`;
        } else if (showtime) {
          formattedDate = showtime.date;
          timeDisplay = `${showtime.start_time} - ${showtime.end_time}`;
        } else if (pendingBooking.time_display) {
          timeDisplay = pendingBooking.time_display;
          formattedDate = pendingBooking.date || new Date().toISOString();
        } else if (pendingBooking.start_time && pendingBooking.end_time) {
          timeDisplay = `${pendingBooking.start_time} - ${pendingBooking.end_time}`;
          formattedDate = pendingBooking.date || new Date().toISOString();
        }

        const finalRoomName =
          roomName || pendingBooking.roomName || "Theater Room";

        const receipt: TicketReceipt = {
          bookingId: newBookingId,
          movieTitle:
            movieDetails?.title || pendingBooking.movie_title || "Movie",
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

        localStorage.removeItem("pendingBooking");
      } catch (bookingError: any) {
        console.error("Error creating booking:", bookingError);
        console.error("Booking error details:", bookingError.response?.data);

        setError(
          "There was an error creating your booking. Please contact support."
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

  // Function to resend email if first attempt failed
  const handleResendEmail = () => {
    if (ticketReceipt) {
      setEmailSending(true);
      setEmailError(null);
      sendEmailReceipt();
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

          {emailSent && (
            <div className="mt-2 flex items-center justify-center text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p>Receipt sent to your email</p>
            </div>
          )}

          {emailError && (
            <div className="mt-2 flex items-center justify-center text-red-600">
              <p className="mb-2">{emailError}</p>
              <button
                onClick={handleResendEmail}
                disabled={emailSending}
                className="ml-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                {emailSending ? "Sending..." : "Resend Email"}
              </button>
            </div>
          )}

          {pointsEarned > 0 && (
            <div className="mt-4 flex items-center justify-center gap-x-2 text-primary">
              <Award className="h-5 w-5" />
              <p className="font-medium">
                You earned {pointsEarned} loyalty points!
              </p>
            </div>
          )}
        </div>

        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-3xl mx-auto"
          style={{ borderTop: "8px solid #FBC700" }}
          id="ticket-receipt"
        >
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
                    Booking ID:{" "}
                    <span className="font-medium">
                      #{ticketReceipt.bookingId}
                    </span>
                  </p>
                </div>
              </div>
            </div>

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

          <div className="px-4 pb-6 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <PDFDownloadLink
                document={<TicketPDF ticketReceipt={ticketReceipt} />}
                fileName="ticket_receipt.pdf"
              >
                {({ blob, url, loading, error }) =>
                  loading ? (
                    "Loading document..."
                  ) : (
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </button>
                  )
                }
              </PDFDownloadLink>
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
