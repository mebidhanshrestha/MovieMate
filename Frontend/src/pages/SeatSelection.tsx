import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Popup from "../components/Popup";

type Seat = {
  seat_number: string;
  status: "available" | "booked";
};

interface Movie {
  _id: string;
  title: string;
  price: number;
  // other movie properties
}

const SeatSelection = () => {
  const { showtimeId, roomId, movieId } = useParams<{ showtimeId: string; roomId: string; movieId: string }>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const date = new URLSearchParams(location.search).get("date") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch seats data
        const seatsResponse = await axios.get(`http://localhost:3001/api/movie/showtimes/${showtimeId}/seats`);
        setSeats(seatsResponse.data.seats);
        
        // Fetch movie data to get the price
        const movieResponse = await axios.get(`http://localhost:3001/api/movie/${movieId}`);
        setMovie(movieResponse.data.movie);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Unable to load data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showtimeId, movieId]);

  const toggleSeatSelection = (seatNumber: string, status: string) => {
    if (status === "booked") return;
    
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((seat) => seat !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const getTicketPrice = (): number => {
    return movie?.price || 0;
  };

  // Group seats by row (assuming seat numbers like A1, A2, B1, B2, etc.)
  const groupedSeats = seats.reduce((acc, seat) => {
    const row = seat.seat_number.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows alphabetically
  const sortedRows = Object.keys(groupedSeats).sort();

  const handleContinue = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    navigate("/menu", { 
      state: { 
        selectedSeats, 
        showtimeId, 
        movieId, 
        roomId,
        date,
        ticketPrice: getTicketPrice() // Pass the ticket price to the next page
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl my-3 mx-auto p-6 bg-white rounded-lg border">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Select Your Seats</h2>
      
      {/* Movie info */}
      {movie && (
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold">{movie.title}</h3>
          <p className="text-gray-600">Ticket Price: Rs. {getTicketPrice().toFixed(2)}</p>
        </div>
      )}
      
      {/* Info and Legend */}
      {showLegend && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowLegend(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2 bg-white border-2 border-gray-300"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2 bg-red-500"></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: "#FBC700" }}></div>
              <span className="text-sm">Selected</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen */}
      <div className="mb-12 relative">
        <div className="h-6 bg-gray-300 rounded-t-3xl mx-auto w-3/4 opacity-70"></div>
        <div className="text-center text-sm text-gray-500 mt-2">SCREEN</div>
        <div className="w-full h-12 bg-gradient-to-b from-gray-200 to-transparent absolute -bottom-12"></div>
      </div>

      {/* Seat Layout */}
      <div className="mb-12">
        {sortedRows.map((row) => (
          <div key={row} className="flex justify-center mb-2">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-600">{row}</div>
            <div className="flex gap-2 flex-wrap justify-center">
              {groupedSeats[row].map((seat) => (
                <button
                  key={seat.seat_number}
                  className={`w-10 h-10 rounded flex items-center justify-center transition-all ${
                    seat.status === "booked"
                      ? "bg-red-500 text-white cursor-not-allowed"
                      : selectedSeats.includes(seat.seat_number)
                      ? "text-gray-800 transform scale-105 shadow-md"
                      : "bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                  style={{
                    backgroundColor: selectedSeats.includes(seat.seat_number) ? "#FBC700" : undefined
                  }}
                  disabled={seat.status === "booked"}
                  onClick={() => toggleSeatSelection(seat.seat_number, seat.status)}
                >
                  {seat.seat_number.substring(1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary and Next Button */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold">Selected Seats ({selectedSeats.length})</h3>
            <p className="text-gray-600">
              {selectedSeats.length > 0 
                ? selectedSeats.sort().join(", ") 
                : "No seats selected"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Ticket price</p>
            <p className="font-bold">Rs. {(getTicketPrice() * selectedSeats.length).toFixed(2)}</p>
          </div>
        </div>
        
        <button
          className="w-full py-3 rounded-lg font-bold text-gray-800 transition-all relative overflow-hidden disabled:opacity-50"
          style={{ 
            backgroundColor: "#FBC700",
            boxShadow: selectedSeats.length > 0 ? "0 4px 12px rgba(251, 199, 0, 0.3)" : "none"
          }}
          disabled={selectedSeats.length === 0}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>

      {/* Login Popup */}
      <Popup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        title="Login Required"
        message="Please log in to continue with your booking."
        primaryButton={{
          text: "Log In",
          onClick: () => {
            navigate("/login", {
              state: { from: location.pathname + location.search }
            });
          }
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => setShowLoginPopup(false)
        }}
      />
    </div>
  );
};

export default SeatSelection;