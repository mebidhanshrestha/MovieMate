import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

type Seat = {
  seat_number: string;
  status: "available" | "booked";
};

const SeatSelection = () => {
  const { showtimeId, roomId, movieId } = useParams<{ showtimeId: string, roomId: string, movieId: string}>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const navigate = useNavigate();


  useEffect(() => {
    axios.get(`http://localhost:3001/api/movie/showtimes/${showtimeId}/seats`)
      .then((response) => setSeats(response.data.seats))
      .catch((error) => console.error("Error fetching seats:", error));
  }, [showtimeId]);

  const toggleSeatSelection = (seatNumber: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((seat) => seat !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Your Seats</h2>
      <div className="grid grid-cols-5 gap-4">
        {seats.map((seat) => (
          <button
            key={seat.seat_number}
            className={`p-4 border rounded-lg text-center ${
              seat.status === "booked" ? "bg-red-500 text-white" :
              selectedSeats.includes(seat.seat_number) ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
            disabled={seat.status === "booked"}
            onClick={() => toggleSeatSelection(seat.seat_number)}
          >
            {seat.seat_number}
          </button>
        ))}
      </div>
      <button
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
        onClick={() => navigate("/menu", { state: { selectedSeats, showtimeId, roomId, movieId } })}
      >
        Next: Select Menu
      </button>
    </div>
  );
};

export default SeatSelection;