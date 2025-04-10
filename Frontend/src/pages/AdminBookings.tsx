import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Define interfaces for our data types
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  weight: number;
  calories: number;
  image: string;
}

interface BookingMenuItem {
  menu_id: string;
  quantity: number;
  menuDetails?: MenuItem;
}

interface Booking {
  _id: string;
  user_id: string;
  movie_id: string | { _id: string };
  room_id: string | { _id: string };
  date: string;
  time_slot: string;
  seats: string[];
  menu_items: BookingMenuItem[];
  total_price: number;
  payment_method: string;
  createdAt: string;
  updatedAt: string;
  userData?: {
    name: string;
    email: string;
  };
  movieData?: {
    title: string;
  };
  roomData?: {
    name: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Movie {
  _id: string;
  title: string;
  status: "hosting" | "expired";
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  showtimes: Showtime[];
}

interface Showtime {
  _id: string;
  movie_id: string;
  date: string;
  start_time: string;
  end_time: string;
  seats: Seat[];
}

interface Seat {
  seat_number: string;
  status: "available" | "booked";
}

const authAxios = axios.create();

authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token.replace(
        /^Bearer\s*/,
        ""
      )}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for filter criteria
  const [filterCriteria, setFilterCriteria] = useState({
    movie: "",
    date: "",
    room: "",
  });

  // State to track applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    movie: "",
    date: "",
    room: "",
  });

  // Selected booking for detailed view
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);
  const [showSeatMap, setShowSeatMap] = useState(false);

  // In the useEffect for fetching movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/movie/");
        // Filter movies with "hosting" status
        const activeMovies = response.data.movies.filter(
          (movie: Movie) => movie.status === "hosting"
        );
        setMovies(activeMovies);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };

    fetchMovies();
  }, []);

  // Get unique dates from bookings (all dates)
  const uniqueDates = [
    ...new Set(
      bookings.map(
        (booking) => new Date(booking.date).toISOString().split("T")[0]
      )
    ),
  ].sort();

  const filteredBookings = bookings.filter((booking) => {
    console.log("Booking Details:", {
      id: booking._id,
      movieId: booking.movie_id,
      movieTitle: booking.movieData?.title,
      date: booking.date,
      roomId: booking.room_id,
    });
    console.log("Applied Filters:", appliedFilters);

    // If no filters are applied, show all bookings
    if (!appliedFilters.movie && !appliedFilters.date && !appliedFilters.room) {
      return true;
    }

    // Check movie filter
    if (appliedFilters.movie) {
      // Determine booking movie ID
      const bookingMovieId =
        typeof booking.movie_id === "object" && booking.movie_id !== null
          ? (booking.movie_id as { _id: string })._id
          : booking.movie_id;

      console.log(
        "Movie Comparison:",
        `Booking Movie ID: ${bookingMovieId}, 
         Filter Movie ID: ${appliedFilters.movie}`
      );

      if (bookingMovieId !== appliedFilters.movie) {
        return false;
      }
    }

    // Check date filter
    if (appliedFilters.date) {
      const bookingDate = new Date(booking.date).toISOString().split("T")[0];
      console.log(
        "Date Comparison:",
        `Booking Date: ${bookingDate}, 
         Filter Date: ${appliedFilters.date}`
      );
      if (bookingDate !== appliedFilters.date) {
        return false;
      }
    }

    // Check room filter
    if (appliedFilters.room) {
      // Determine booking room ID
      const bookingRoomId =
        typeof booking.room_id === "object" && booking.room_id !== null
          ? (booking.room_id as { _id: string })._id
          : booking.room_id;

      console.log(
        "Room Comparison:",
        `Booking Room ID: ${bookingRoomId}, 
         Filter Room ID: ${appliedFilters.room}`
      );

      if (bookingRoomId !== appliedFilters.room) {
        return false;
      }
    }

    return true;
  });

  // Handle filter input changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    const selectedMovie = movies.find(
      (movie) => movie.title === filterCriteria.movie
    );
    const selectedRoom = rooms.find(
      (room) => room.name === filterCriteria.room
    );

    const newFilters = {
      movie: selectedMovie ? selectedMovie._id : "",
      date: filterCriteria.date,
      room: selectedRoom ? selectedRoom._id : "",
    };

    console.log("Applying Precise Filters:", newFilters);
    setAppliedFilters(newFilters);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({
      movie: "",
      date: "",
      room: "",
    });
    setAppliedFilters({
      movie: "",
      date: "",
      room: "",
    });
  };

  // Load all necessary data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        console.log("Using token:", token ? "exists" : "missing");

        // Fetch all required data
        const [bookingsRes, menuItemsRes, usersRes, moviesRes, roomsRes] =
          await Promise.all([
            authAxios.get("http://localhost:3001/api/booking-management/all"),
            authAxios.get("http://localhost:3001/api/menu"),
            authAxios.get("http://localhost:3001/api/users"),
            authAxios.get("http://localhost:3001/api/movie"),
            authAxios.get("http://localhost:3001/api/room"),
          ]);

        // Add more robust error checking
        if (!bookingsRes.data || !bookingsRes.data.bookings) {
          throw new Error("Invalid bookings data structure");
        }

        // Prepare bookings with additional data
        const bookingsWithData = bookingsRes.data.bookings.map(
          (booking: Booking) => {
            return {
              ...booking,
              userData: booking.userData || {
                name: "Unknown",
                email: "N/A",
              },
              movieData: booking.movieData || {
                title: "Unknown Movie",
              },
              roomData: booking.roomData || {
                name: "Unknown Room",
              },
              menu_items: booking.menu_items.map((item) => ({
                ...item,
                menuDetails: item.menuDetails || null,
              })),
            };
          }
        );

        setBookings(bookingsWithData);
        setMenuItems(menuItemsRes.data || []);
        setUsers(usersRes.data.users || []);
        setMovies(moviesRes.data.movies || []);
        setRooms(roomsRes.data.rooms || []);
        setLoading(false);
      } catch (err: any) {
        console.error("Full error object:", err);

        if (err.response) {
          console.error("Response error data:", err.response.data);
          console.error("Response error status:", err.response.status);

          if (err.response.status === 401) {
            localStorage.removeItem("token");
            setError("Authentication failed. Please log in again.");
          } else {
            setError(err.response.data.message || "An error occurred");
          }
        } else if (err.request) {
          setError("No response from server. Please check your connection.");
        } else {
          setError(err.message);
        }

        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // View booking details
  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);

    try {
      setBookingDetails(booking);
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setError("Failed to load booking details.");
    }
  };

  // Function to toggle seat map view
  const toggleSeatMap = () => {
    setShowSeatMap(!showSeatMap);
  };

  // Render the seat map
  const renderSeatMap = () => {
    if (!bookingDetails) return null;

    // Get the showtime for this booking
    const room = rooms.find((r) => r._id === bookingDetails.room_id);
    if (!room) return <p>Room information not available</p>;

    const showtime = room.showtimes.find(
      (s) => s._id === bookingDetails.time_slot
    );
    if (!showtime) {
      // If we don't have the actual showtime data, render a simplified view
      const rows = ["A", "B", "C", "D", "E"];
      const columns = Array.from({ length: 10 }, (_, i) => i + 1);

      return (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Seat Map</h3>
          <div className="mb-4 flex justify-center">
            <div className="bg-gray-800 text-white px-16 py-2 rounded text-center">
              Screen
            </div>
          </div>
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-gray-200 mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 mr-2"></div>
              <span>Booked by this user</span>
            </div>
          </div>
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row} className="flex gap-2 justify-center">
                <div className="flex items-center justify-center w-8 h-8 font-bold">
                  {row}
                </div>
                {columns.map((col) => {
                  const seatId = `${row}${col}`;
                  const isBooked = bookingDetails.seats.includes(seatId);

                  return (
                    <div
                      key={seatId}
                      className={`flex items-center justify-center w-8 h-8 rounded cursor-default
                        ${isBooked ? "bg-red-500 text-white" : "bg-gray-200"}`}
                    >
                      {col}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Render the actual seat map based on the showtime data
    // This will be more accurate but requires the actual showtime data
    const bookedSeats = bookingDetails.seats;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">Seat Map</h3>
        <div className="mb-4 flex justify-center">
          <div className="bg-gray-800 text-white px-16 py-2 rounded text-center">
            Screen
          </div>
        </div>
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center mr-4">
            <div className="w-4 h-4 bg-gray-200 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span>Booked by this user</span>
          </div>
        </div>
        <div className="grid gap-3">
          {Object.entries(
            showtime.seats.reduce((rows: { [key: string]: Seat[] }, seat) => {
              const row = seat.seat_number.charAt(0);
              if (!rows[row]) rows[row] = [];
              rows[row].push(seat);
              return rows;
            }, {})
          ).map(([row, seats]) => (
            <div key={row} className="flex gap-2 justify-center">
              <div className="flex items-center justify-center w-8 h-8 font-bold">
                {row}
              </div>
              {seats.map((seat) => {
                const isBooked = bookedSeats.includes(seat.seat_number);
                const col = seat.seat_number.substring(1);

                return (
                  <div
                    key={seat.seat_number}
                    className={`flex items-center justify-center w-8 h-8 rounded cursor-default
                      ${isBooked ? "bg-red-500 text-white" : "bg-gray-200"}`}
                  >
                    {col}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render food items
  const renderFoodItems = () => {
    if (!bookingDetails || bookingDetails.menu_items.length === 0) {
      return <p className="mt-4">No food items purchased with this booking.</p>;
    }

    return (
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">Food Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Item</th>
                <th className="py-2 px-4 border-b">Quantity</th>
                <th className="py-2 px-4 border-b">Price</th>
                <th className="py-2 px-4 border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              {bookingDetails.menu_items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b flex items-center">
                    {item.menuDetails ? (
                      <>
                        <img
                          src={`http://localhost:3001${item.menuDetails.image}`}
                          alt={item.menuDetails.name}
                          className="w-12 h-12 object-cover rounded mr-2"
                        />
                        <div>
                          <p className="font-medium">{item.menuDetails.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.menuDetails.weight}g,{" "}
                            {item.menuDetails.calories} Kcal
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">
                        Item details not available
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {item.menuDetails ? `Rs. ${item.menuDetails.price}` : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {item.menuDetails
                      ? `Rs. ${(item.menuDetails.price * item.quantity).toFixed(
                          2
                        )}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td
                  colSpan={3}
                  className="py-2 px-4 border-b font-bold text-right"
                >
                  Total:
                </td>
                <td className="py-2 px-4 border-b text-right font-bold">
                  Rs. {bookingDetails.total_price.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading bookings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl">
      <h2 className="text-3xl font-bold mb-8 text-primary relative">
        <span className="inline-block pb-2">Bookings Management</span>
      </h2>

      {/* Filters */}
      <div className="mb-8 p-6 bg-white shadow-lg rounded-xl border-t-4 border-primary">
        <h3 className="text-xl font-bold mb-4 text-primary">Filter Bookings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Movie:
            </label>
            <select
              name="movie"
              value={filterCriteria.movie}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Movies</option>
              {movies
                .filter((movie) => movie.status === "hosting")
                .map((movie) => (
                  <option key={movie._id} value={movie.title}>
                    {movie.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Date:
            </label>
            <select
              name="date"
              value={filterCriteria.date}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Dates</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Room:
            </label>
            <select
              name="room"
              value={filterCriteria.room}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Rooms</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-100 transition-colors duration-200"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail View */}
      {bookingDetails && (
        <div className="mb-8 p-6 bg-white shadow-lg rounded-xl border-l-4 border-primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-primary">Booking Details</h3>
            <button
              onClick={() => setBookingDetails(null)}
              className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center"
            >
              <span className="mr-1">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="font-medium text-gray-700">Booking ID:</p>
                <p>{bookingDetails._id}</p>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">Customer:</p>
                <p>{bookingDetails.userData?.name || "Unknown"}</p>
                <p className="text-gray-500">
                  {bookingDetails.userData?.email || "No email"}
                </p>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">Movie:</p>
                <p>{bookingDetails.movieData?.title || "Unknown"}</p>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">Room:</p>
                <p>{bookingDetails.roomData?.name || "Unknown"}</p>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="font-medium text-gray-700">Date & Time:</p>
                <p>{new Date(bookingDetails.date).toLocaleDateString()}</p>
                <p>{bookingDetails.time_slot}</p>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">Seats:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {bookingDetails.seats.map((seat) => (
                    <span
                      key={seat}
                      className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700">Payment Details:</p>
                <p>Method: {bookingDetails.payment_method}</p>
                <p>Total: Rs. {bookingDetails.total_price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4 flex">
            <button
              onClick={toggleSeatMap}
              className="bg-primary text-white px-4 py-2 rounded mr-4 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              {showSeatMap ? "Hide Seat Map" : "View Seat Map"}
            </button>
          </div>

          {showSeatMap && renderSeatMap()}

          {/* Food Items */}
          {renderFoodItems()}
        </div>
      )}

      {/* Bookings List */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movie
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seats
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  No bookings found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr
                  key={booking._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium">
                      {booking.userData?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.userData?.email}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {booking.movieData?.title || "Unknown"}
                  </td>
                  <td className="py-3 px-4">
                    {booking.roomData?.name || "Unknown Room"}
                  </td>
                  <td className="py-3 px-4">
                    <p>{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{booking.time_slot}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {booking.seats.slice(0, 3).map((seat) => (
                        <span
                          key={seat}
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-xs"
                        >
                          {seat}
                        </span>
                      ))}
                      {booking.seats.length > 3 && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                          +{booking.seats.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    Rs. {booking.total_price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-100 transition-colors duration-200 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBookings;
