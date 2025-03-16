import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

type MenuItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
};

const MenuSelection = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats, showtimeId, movieId, roomId } = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const date = queryParams.get("date");
  useEffect(() => {
    axios.get("http://localhost:3001/api/menu")
      .then((response) => setMenu(response.data))
      .catch((error) => console.error("Error fetching menu:", error));
  }, []);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: quantity }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Snacks (Optional)</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {menu.map((item) => (
          <div key={item._id} className="border p-4 rounded-lg shadow-md">
            <img src={item.image} alt={item.name} className="w-full h-32 object-cover mb-2" />
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-gray-600">${item.price.toFixed(2)}</p>
            <input
              type="number"
              min="0"
              value={selectedItems[item._id] || 0}
              onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value))}
              className="border p-2 w-full mt-2"
            />
          </div>
        ))}
      </div>
      <button
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
        onClick={() => navigate("/confirmation", { state: { selectedSeats, showtimeId, movieId, roomId, date, selectedItems } })}
      >
        Next: Confirm Booking
      </button>
    </div>
  );
};

export default MenuSelection;