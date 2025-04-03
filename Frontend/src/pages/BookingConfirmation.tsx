import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

interface MenuItem {
  menu_id: string;
  quantity: number;
}

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State to store menu prices
  const [menuPrices, setMenuPrices] = useState<{[key: string]: number}>({});

  // Extract state safely
  const { 
    selectedSeats, 
    showtimeId, 
    movieId, 
    roomId, 
    date, 
    selectedItems, 
    ticketPrice 
  }: {
    selectedSeats?: string[];
    showtimeId?: string;
    movieId?: string;
    roomId?: string;
    date?: string;
    selectedItems?: { [key: string]: number };
    ticketPrice?: number;
  } = location.state || {};

  // Fetch menu prices on component mount
  useEffect(() => {
    const fetchMenuPrices = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/menu');
        const priceMap = response.data.reduce((acc: any, item: any) => {
          acc[item._id] = item.price;
          return acc;
        }, {});
        setMenuPrices(priceMap);
      } catch (error) {
        console.error('Error fetching menu prices:', error);
      }
    };

    fetchMenuPrices();
  }, []);

  // Calculate total price of menu items
  const calculateMenuItemsTotal = (): number => {
    if (!selectedItems) return 0;
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const itemPrice = menuPrices[itemId] || 0;
      return total + (itemPrice * (quantity as number));
    }, 0);
  };

  // Calculate total price including ticket and menu items
  const calculateTotalPrice = (): number => {
    const ticketTotal = (ticketPrice || 0) * (selectedSeats?.length || 0);
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
      date,
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

  // Render loading state if needed
  if (!location.state) {
    return <div>Loading booking details...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Booking Confirmation</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Selected Seats</h3>
            <p>{selectedSeats?.length} seat(s)</p>
          </div>

          {selectedItems && Object.keys(selectedItems).length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Selected Snacks</h3>
              <ul className="list-disc pl-5">
                {Object.entries(selectedItems).map(([itemId, quantity]) => (
                  <li key={itemId}>
                    {itemId}: {quantity} 
                    (${((menuPrices[itemId] || 0) * (quantity as number)).toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between">
              <span>Ticket Total:</span>
              <span>${((ticketPrice || 0) * (selectedSeats?.length || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Menu Items Total:</span>
              <span>${calculateMenuItemsTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total Price:</span>
              <span>${calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          <button
            className="w-full mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={handleConfirmBooking}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;