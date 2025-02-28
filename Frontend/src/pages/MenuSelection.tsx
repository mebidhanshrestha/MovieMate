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
};

const MenuSelection = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
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

  // Extract all unique categories
  const categories = [
    "all",
    ...Array.from(new Set(menu.map((item) => item.category || "other"))),
  ];

  // Filter menu items based on active tab
  const filteredMenu =
    activeTab === "all"
      ? menu
      : menu.filter((item) => (item.category || "other") === activeTab);

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

      {/* Category Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === category
                  ? "text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{
                backgroundColor: activeTab === category ? "#FBC700" : "#f3f4f6",
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredMenu.map((item) => (
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
                  ${item.price.toFixed(2)}
                </p>
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 mb-4">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-4">
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
                <button
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor:
                      (selectedItems[item._id] || 0) > 0
                        ? "#FBC700"
                        : "transparent",
                  }}
                  onClick={() => {
                    if (selectedItems[item._id]) {
                      handleQuantityChange(item._id, 0);
                    } else {
                      handleQuantityChange(item._id, 1);
                    }
                  }}
                >
                  {(selectedItems[item._id] || 0) > 0 ? "Remove" : "Add"}
                </button>
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
            <p className="font-bold text-xl">${getTotalPrice().toFixed(2)}</p>
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
