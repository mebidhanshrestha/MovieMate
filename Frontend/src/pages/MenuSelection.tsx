import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

type MenuItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  weight: number;
  calories: number;
};

const MenuSelection = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats, showtimeId, movieId, roomId } = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const date = queryParams.get("date");

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:3001/api/menu")
      .then((response) => {
        setMenu(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching menu:", error);
        setError("Unable to load menu items. Please try again.");
        setLoading(false);
      });
  }, []);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity < 0) return;

    setSelectedItems((prev) => {
      const updated = { ...prev, [itemId]: quantity };
      // Remove items with quantity 0
      if (quantity === 0) {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const getTotalPrice = () => {
    return menu.reduce((total, item) => {
      const quantity = selectedItems[item._id] || 0;
      return total + item.price * quantity;
    }, 0);
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedItems).reduce(
      (sum, quantity) => sum + quantity,
      0
    );
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
    <div className="max-w-6xl mx-auto p-6 border rounded-lg my-3">
      <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
        Food & Drinks
      </h2>
      <p className="text-center text-gray-500 mb-6">
        Enhance your movie experience with delicious treats
      </p>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {menu.map((item) => (
          <div
            key={item._id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative h-40">
              <img
                src={`http://localhost:3001${item.image}`}
                alt={item.name}
                className="w-full h-32 object-cover mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/api/placeholder/300/450"; // Fallback image
                }}
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.name}
                </h3>
                <p className="font-bold text-gray-800">
                  Rs. {item.price.toFixed(2)}
                </p>
              </div>
              
              {/* Nutritional Information */}
              {(item.weight || item.calories) && (
                <div className="flex items-center gap-4 text-gray-500 mb-2">
                  {item.weight ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <span className="text-xs">{item.weight}g</span>
                    </div>
                  ) : null}
                  
                  {item.calories ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      <span className="text-xs">{item.calories} Kcal</span>
                    </div>
                  ) : null}
                </div>
              )}
              
              {item.description && (
                <p className="text-sm text-gray-500 mb-4">{item.description}</p>
              )}
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                    onClick={() =>
                      handleQuantityChange(
                        item._id,
                        (selectedItems[item._id] || 0) - 1
                      )
                    }
                    disabled={(selectedItems[item._id] || 0) === 0}
                  >
                    −
                  </button>
                  <span className="px-4 py-1 text-center min-w-[40px]">
                    {selectedItems[item._id] || 0}
                  </span>
                  <button
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                    onClick={() =>
                      handleQuantityChange(
                        item._id,
                        (selectedItems[item._id] || 0) + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary & Checkout */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Your Order</h3>
            <p className="text-gray-600">
              {getSelectedItemsCount() > 0
                ? `${getSelectedItemsCount()} items selected`
                : "No items selected"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-bold text-xl">Rs. {getTotalPrice().toFixed(2)}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            className="flex-1 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700"
            onClick={() =>
              navigate("/confirmation", {
                state: {
                  selectedSeats,
                  showtimeId,
                  movieId,
                  roomId,
                  date,
                  selectedItems: {},
                },
              })
            }
          >
            Skip
          </button>
          <button
            className="flex-1 py-3 rounded-lg font-bold text-gray-800 transition-all"
            style={{
              backgroundColor: "#FBC700",
              boxShadow: "0 4px 12px rgba(251, 199, 0, 0.3)",
            }}
            onClick={() =>
              navigate("/confirmation", {
                state: {
                  selectedSeats,
                  showtimeId,
                  movieId,
                  roomId,
                  date,
                  selectedItems,
                },
              })
            }
          >
            Next: Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuSelection;