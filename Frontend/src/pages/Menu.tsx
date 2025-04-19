import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  weight: number;  // Changed from optional to required
  calories: number; // Changed from optional to required
}

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const foodScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get<MenuItem[]>("http://localhost:3001/api/menu")
      .then((res) => setMenuItems(res.data))
      .catch((err) => console.error(err));
  }, []);

  const scroll = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right"
  ) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="px-8 py-6 container mx-auto">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
        Food & Beverages
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menuItems.length > 0 ? (
          menuItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-[#BEBEBE] p-4 shadow-md"
            >
              <div className="min-h-[244px] mb-4">
                <img
                  src={`http://localhost:3001${item.image}`}
                  alt={item.name}
                  width={202}
                  height={224}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) =>
                    (e.currentTarget.src = "path/to/placeholder/image.jpg")
                  }
                />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-2">{item.name}</h3>
                <div className="flex items-center gap-4 mb-3 text-gray-600">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span className="text-sm">{item.weight}g</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                    <span className="text-sm">{item.calories} Kcal</span>
                  </div>
                </div>
                <span className="text-green-500 font-medium text-lg">
                  Rs. {item.price}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">
            No menu items available.
          </p>
        )}
      </div>
    </div>
  );
};

export default Menu;