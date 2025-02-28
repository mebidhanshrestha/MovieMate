import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

interface Showtime {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  movie_id?: string;
  seats?: any[];
}

interface Booking {
  _id: string;
  user_id: string;
  movie_id: string | { _id: string; title?: string };
  room_id: string | { _id: string; name?: string };
  date: string;
  time_slot: string | Showtime;
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
    _id: string;
  };
  showtimeDetails?: Showtime;
  fullRoomData?: any;
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

interface Seat {
  seat_number: string;
  status: "available" | "booked";
}

const authAxios = axios.create();

authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token.replace(/^Bearer\s*/, "")}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log("Invalid date:", dateString);
      return "N/A";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateString);
    return "N/A";
  }
};

// Helper function to format a Date object to "YYYY-MM-DD" in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    movie: "",
    date: null as Date | null,
    room: "",
    time: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    movie: "",
    date: "",
    room: "",
    time: "",
  });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);
  const [showSeatMap, setShowSeatMap] = useState(false);

  const fetchRoomDetails = async (booking: Booking): Promise<Booking> => {
    try {
      const roomId = typeof booking.room_id === 'object' ? booking.room_id._id : booking.room_id;
      
      if (!roomId) {
        console.error('No room ID found for booking:', booking._id);
        return booking;
      }
      
      const roomResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/room/therater`,
        { room_id: roomId }
      );
      
      if (roomResponse.data?.success && roomResponse.data.room) {
        const roomData = roomResponse.data.room;
        
        let showtimeDetails: Showtime | null = null;
        if (roomData.showtimes && roomData.showtimes.length > 0) {
          if (typeof booking.time_slot === 'object') {
            showtimeDetails = booking.time_slot;
          } else {
            showtimeDetails = roomData.showtimes.find(
              (st: Showtime) => st._id === booking.time_slot
            ) || null;
          }
        }
        
        return {
          ...booking,
          roomData: {
            name: roomData.name,
            _id: roomData._id
          },
          fullRoomData: roomData,
          showtimeDetails: showtimeDetails || booking.showtimeDetails,
          time_slot: showtimeDetails || booking.time_slot
        };
      }
      return booking;
    } catch (error) {
      console.error("Error fetching room details:", error);
      return booking;
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/movie/`);
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

  const filteredBookings = bookings.filter((booking) => {
    let matches = true;

    if (appliedFilters.movie) {
      const bookingMovieId = typeof booking.movie_id === "object" && booking.movie_id !== null
        ? booking.movie_id._id
        : booking.movie_id;
      matches = matches && bookingMovieId === appliedFilters.movie;
    }

    if (appliedFilters.date) {
      // Determine the booking date to compare with
      let bookingDate: Date | null = null;
      if (booking.showtimeDetails && booking.showtimeDetails.date) {
        bookingDate = new Date(booking.showtimeDetails.date);
      } else if (typeof booking.time_slot === 'object' && booking.time_slot.date) {
        bookingDate = new Date(booking.time_slot.date);
      } else if (booking.date) {
        bookingDate = new Date(booking.date);
      }

      if (!bookingDate || isNaN(bookingDate.getTime())) {
        console.warn(`Invalid booking date for booking ID ${booking._id}:`, booking);
        return false;
      }

      const bookingDateStr = formatLocalDate(bookingDate);
      console.log(`Comparing filter date: ${appliedFilters.date} with booking date: ${bookingDateStr}`);
      matches = matches && bookingDateStr === appliedFilters.date;
    }

    if (appliedFilters.room) {
      const bookingRoomId = typeof booking.room_id === "object" && booking.room_id !== null
        ? booking.room_id._id
        : booking.room_id;
      matches = matches && bookingRoomId === appliedFilters.room;
    }

    if (appliedFilters.time) {
      let bookingTime = "N/A";
      if (booking.showtimeDetails && booking.showtimeDetails.start_time) {
        bookingTime = booking.showtimeDetails.start_time;
      } else if (typeof booking.time_slot === 'object' && booking.time_slot.start_time) {
        bookingTime = booking.time_slot.start_time;
      }
      matches = matches && bookingTime === appliedFilters.time;
    }

    return matches;
  });

  const handleFilterChange = (name: string, value: any) => {
    console.log(`Filter changed: ${name} =`, value);
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    const newFilters = { ...filterCriteria };

    if (filterCriteria.movie) {
      const selectedMovie = movies.find(movie => movie._id === filterCriteria.movie);
      newFilters.movie = selectedMovie ? selectedMovie._id : "";
    }

    if (filterCriteria.date) {
      const filterDateStr = formatLocalDate(filterCriteria.date);
      console.log("Applying date filter:", filterDateStr);
      newFilters.date = filterDateStr;
    } else {
      newFilters.date = "";
    }

    if (filterCriteria.room) {
      const selectedRoom = rooms.find(room => room._id === filterCriteria.room);
      newFilters.room = selectedRoom ? selectedRoom._id : "";
    }

    if (filterCriteria.time) {
      newFilters.time = filterCriteria.time;
    }

    console.log("Applied filters:", newFilters);
    setAppliedFilters(newFilters);
  };

  const resetFilters = () => {
    setFilterCriteria({
      movie: "",
      date: null,
      room: "",
      time: "",
    });
    setAppliedFilters({
      movie: "",
      date: "",
      room: "",
      time: "",
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        const [bookingsRes, menuItemsRes, usersRes, moviesRes, roomsRes] =
          await Promise.all([
            authAxios.get(`${import.meta.env.VITE_API_BASE_URL}/api/booking-management/all`),
            authAxios.get(`${import.meta.env.VITE_API_BASE_URL}/api/menu`),
            authAxios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`),
            authAxios.get(`${import.meta.env.VITE_API_BASE_URL}/api/movie`),
            authAxios.get(`${import.meta.env.VITE_API_BASE_URL}/api/room`),
          ]);
        
        const roomsData = roomsRes.data.rooms || [];
        setRooms(roomsData);
        
        const roomMap: { [key: string]: string } = {};
        roomsData.forEach((room: Room) => {
          roomMap[room._id] = room.name;
        });

        const bookingsWithData = await Promise.all(
          bookingsRes.data.bookings.map(async (booking: Booking) => {
            let roomName = "Unknown Room";
            const roomId = typeof booking.room_id === 'object' ? booking.room_id._id : booking.room_id;
            
            if (roomMap[roomId]) {
              roomName = roomMap[roomId];
            } else if (typeof booking.room_id === 'object' && booking.room_id?.name) {
              roomName = booking.room_id.name;
            } else if (booking.roomData?.name) {
              roomName = booking.roomData.name;
            }

            const enrichedBooking = {
              ...booking,
              userData: booking.userData || {
                name: "Unknown",
                email: "N/A",
              },
              movieData: booking.movieData || {
                title: "Unknown Movie",
              },
              roomData: {
                name: roomName,
                _id: roomId
              },
              menu_items: booking.menu_items.map((item) => ({
                ...item,
                menuDetails: item.menuDetails || null,
              })),
            };

            return await fetchRoomDetails(enrichedBooking);
          })
        );

        console.log("Fetched bookings:", bookingsWithData);
        setBookings(bookingsWithData);
        setMenuItems(menuItemsRes.data || []);
        setUsers(usersRes.data.users || []);
        setMovies(moviesRes.data.movies || []);
        setLoading(false);
      } catch (err: any) {
        console.error("Full error object:", err);

        if (err.response) {
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

  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setLoading(true);
    
    try {
      const enrichedBooking = await fetchRoomDetails(booking);
      setBookingDetails(enrichedBooking);
    } catch (err) {
      console.error("Error preparing booking details:", err);
      setError("Failed to load booking details.");
      setBookingDetails(booking);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeatMap = () => {
    setShowSeatMap(!showSeatMap);
  };

  const renderBookingRow = (booking: Booking) => {
    let displayDate = "N/A";
    let displayTime = "N/A";
    let roomName = "Unknown Room";

    if (booking.roomData?.name) {
      roomName = booking.roomData.name;
    } else if (typeof booking.room_id === 'object' && booking.room_id.name) {
      roomName = booking.room_id.name;
    }

    if (booking.showtimeDetails && booking.showtimeDetails.date) {
      displayDate = new Date(booking.showtimeDetails.date).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      displayTime = `${booking.showtimeDetails.start_time} - ${booking.showtimeDetails.end_time}`;
    } else if (typeof booking.time_slot === 'object' && booking.time_slot.date) {
      displayDate = new Date(booking.time_slot.date).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      displayTime = `${booking.time_slot.start_time || "N/A"} - ${booking.time_slot.end_time || "N/A"}`;
    } else if (booking.date) {
      displayDate = new Date(booking.date).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      displayTime = typeof booking.time_slot === 'string' ? booking.time_slot : "N/A";
    }

    return (
      <tr key={booking._id} className="hover:bg-gray-50 transition-colors duration-150">
        <td className="py-3 px-4">
          <p className="font-medium">{booking.userData?.name || "Unknown"}</p>
          <p className="text-sm text-gray-500">{booking.userData?.email}</p>
        </td>
        <td className="py-3 px-4">{booking.movieData?.title || "Unknown"}</td>
        <td className="py-3 px-4 font-medium">{roomName}</td>
        <td className="py-3 px-4">
          <p>{displayDate}</p>
          <p className="text-sm text-gray-500">{displayTime}</p>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-1">
            {booking.seats.slice(0, 3).map((seat) => (
              <span key={seat} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
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
        <td className="py-3 px-4 font-medium">Rs. {booking.total_price.toFixed(2)}</td>
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
    );
  };

  const renderSeatMap = () => {
    if (!bookingDetails) return null;

    const roomId = typeof bookingDetails.room_id === "object" 
      ? bookingDetails.room_id._id 
      : bookingDetails.room_id;
      
    const room = rooms.find((r) => r._id === roomId);
    if (!room) return <p>Room information not available</p>;

    const showtime = room.showtimes.find(
      (s) => s._id === (typeof bookingDetails.time_slot === 'string' ? bookingDetails.time_slot : bookingDetails.time_slot?._id)
    );
    
    if (!showtime) {
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

  const renderFoodItems = () => {
    if (!bookingDetails || !bookingDetails.menu_items || bookingDetails.menu_items.length === 0) {
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
                        {item.menuDetails.image && (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${item.menuDetails.image}`}
                            alt={item.menuDetails.name}
                            className="w-12 h-12 object-cover rounded mr-2"
                          />
                        )}
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
                      ? `Rs. ${(item.menuDetails.price * item.quantity).toFixed(2)}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={3} className="py-2 px-4 border-b font-bold text-right">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Movie:</label>
            <select
              name="movie"
              value={filterCriteria.movie}
              onChange={(e) => handleFilterChange("movie", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Movies</option>
              {movies
                .filter((movie) => movie.status === "hosting")
                .map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Date:</label>
            <DatePicker
              selected={filterCriteria.date}
              onChange={(date: Date | null) => handleFilterChange("date", date)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholderText="Select Date"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Room:</label>
            <select
              name="room"
              value={filterCriteria.room}
              onChange={(e) => handleFilterChange("room", e.target.value)}
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

          <div>
            <label className="block font-medium text-gray-700 mb-1">Time:</label>
            <select
              name="time"
              value={filterCriteria.time}
              onChange={(e) => handleFilterChange("time", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Times</option>
              {[...new Set(bookings.map(b => {
                if (b.showtimeDetails && b.showtimeDetails.start_time) return b.showtimeDetails.start_time;
                if (typeof b.time_slot === 'object' && b.time_slot.start_time) return b.time_slot.start_time;
                return "N/A";
              }))].filter(time => time !== "N/A" && time).sort().map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end mb-1 space-x-2">
            <button
              onClick={applyFilters}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-100 transition-colors duration-200"
            >
              Apply
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
                <p className="font-medium text-gray-800">
                  {bookingDetails.roomData?.name || 
                   (typeof bookingDetails.room_id === 'object' ? bookingDetails.room_id.name : "Unknown Room")}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="font-medium text-gray-700">Date & Time:</p>
                {bookingDetails.showtimeDetails ? (
                  <>
                    <p className="text-gray-800">
                      {formatDate(bookingDetails.showtimeDetails.date)}
                    </p>
                    <p className="text-gray-700 font-medium">
                      {bookingDetails.showtimeDetails.start_time} - {bookingDetails.showtimeDetails.end_time}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-800">
                      {formatDate(bookingDetails.date)}
                    </p>
                    <p className="text-gray-700 font-medium">
                      {typeof bookingDetails.time_slot === 'object' 
                        ? `${bookingDetails.time_slot.start_time || "N/A"} - ${bookingDetails.time_slot.end_time || "N/A"}`
                        : bookingDetails.time_slot || "N/A"}
                    </p>
                  </>
                )}
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
                <p className="font-medium text-gray-700">Payment Information:</p>
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
                Date & Time
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
              filteredBookings.map(booking => renderBookingRow(booking))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBookings;