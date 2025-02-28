import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  weight?: string;
  calories?: string;
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
                <div className="mb-3 [&_p]:text-base [&_p]:font-normal">
                  <p>{item.weight}g</p>
                  <p>{item.calories}Kcal</p>
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
