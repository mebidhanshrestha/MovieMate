import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats, showtimeId, movieId, roomId, date, selectedItems } = location.state || {};

  const handleConfirmBooking = () => {
    axios.post("http://localhost:3001/api/bookings", {
      user_id: localStorage.getItem("id"), // This should be dynamically set
      movie_id: movieId,
      room_id: roomId,
      date,
      time_slot: showtimeId,
      seats: selectedSeats,
      menuItems: selectedItems,
      payment_method: "card", // Default to card payment for now
      status: "confirmed",
    })
    .then(() => {
      alert("Booking confirmed!");
      navigate("/"); // Redirect to home
    })
    .catch(error => console.error("Error confirming booking:", error));
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Booking Confirmation</h2>
      <p className="mb-4">You have selected {selectedSeats.length} seats.</p>
      {selectedItems && Object.keys(selectedItems).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Selected Snacks:</h3>
          <ul>
            {Object.entries(selectedItems).map(([itemId, quantity]) => (
              <li key={itemId}>Item {itemId}: {quantity as number}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg"
        onClick={handleConfirmBooking}
      >
        Confirm Booking
      </button>
    </div>
  );
};

export default BookingConfirmation;