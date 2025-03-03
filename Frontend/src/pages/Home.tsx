import { useState, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import Burger from "../assets/images/burger-banner.png";
import Menu from "../assets/images/menu-banner.png";
import Chicken from "../assets/images/chicken-banner.png";
import avatar from "../assets/images/avatar.jpg";
import venom from "../assets/images/venom.jpg";
import bloodshot from "../assets/images/bloodshot.jpeg";
import gold from "../assets/images/gold.jpg";
import flash from "../assets/images/flash.jpg";
import john from "../assets/images/john.jpeg";
import mission from "../assets/images/mission.jpg";
import black from "../assets/images/black-panther.jpg";
import popcorn_platter from "../assets/images/popcorn-platter.png";
import ham from '../assets/images/ham-burger.png';
import ranch from '../assets/images/ranch-chicken.png';
import large from '../assets/images/large-nachos-drinks.png';

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// Define TypeScript interfaces
interface MovieItem {
  title: string;
  genre: string;
  image: string;
}

interface FoodItem {
  name: string;
  weight: string;
  calories: string;
  price: string;
  image: string;
}

type TabType = "nowShowing" | "upcoming";

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("nowShowing");
  const movieScrollRef = useRef<HTMLDivElement | null>(null);
  const foodScrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right"): void => {
    if (ref.current) {
      const scrollAmount = 300; // Adjust this value to control scroll distance
      const newScrollPosition =
        ref.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      ref.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  const nowShowingMovies: MovieItem[] = [
    {
      title: "Avatar",
      genre: "Sci-Fi/Action",
      image: avatar,
    },
    {
      title: "Venom 2",
      genre: "Action/Sci-fi",
      image: venom,
    },
    {
      title: "Bloodshot",
      genre: "Action/Sci-fi",
      image: bloodshot,
    },
    {
      title: "The City of Gold",
      genre: "Adventure/Thriller",
      image: gold,
    },
    {
      title: "Venom 2",
      genre: "Action/Sci-fi",
      image: venom,
    },
    {
      title: "Bloodshot",
      genre: "Action/Sci-fi",
      image: bloodshot,
    },
  ];

  const upcomingMovies: MovieItem[] = [
    {
      title: "Black Panther 2",
      genre: "Action/Adventure",
      image: black,
    },
    {
      title: "The Flash",
      genre: "Action/Sci-fi",
      image: flash,
    },
    {
      title: "John Wick 4",
      genre: "Action/Thriller",
      image: john,
    },
    {
      title: "Mission Impossible 7",
      genre: "Action/Spy",
      image: mission,
    },
    {
      title: "Black Panther 2",
      genre: "Action/Adventure",
      image: black,
    },
    {
      title: "The Flash",
      genre: "Action/Sci-fi",
      image: flash,
    },
  ];

  const foodItems: FoodItem[] = [
    {
      name: "Popcorn Platter",
      weight: "100g",
      calories: "500Kcal",
      price: "Rs. 899",
      image: popcorn_platter,
    },
    {
      name: "Large Nacho & Drink",
      weight: "310g",
      calories: "600Kcal",
      price: "Rs. 699",
      image: large,
    },
    {
      name: "Ham Burger w/ Fries & Drink",
      weight: "410g",
      calories: "800Kcal",
      price: "Rs. 899",
      image: ham,
    },
    {
      name: "Ranch Chicken Wrap",
      weight: "400g",
      calories: "402Kcal",
      price: "Rs. 299",
      image: ranch,
    },
    {
      name: "Popcorn Platter",
      weight: "100g",
      calories: "500Kcal",
      price: "Rs. 899",
      image: popcorn_platter,
    },
    {
      name: "Large Nacho & Drink",
      weight: "310g",
      calories: "600Kcal",
      price: "Rs. 699",
      image: large,
    },
  ];

  const currentMovies: MovieItem[] =
    activeTab === "nowShowing" ? nowShowingMovies : upcomingMovies;

  return (
    <>
      {/* Hero Banner */}
      <div className="px-4 sm:px-6 lg:px-8 py-10 [&_img]:rounded-[16px] [&_img]:overflow-hidden">
        <Swiper
          spaceBetween={30}
          centeredSlides={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          modules={[Autoplay, Pagination]}
          className="mySwiper"
        >
          <SwiperSlide>
            <img
              src={Burger}
              alt="Delicious burger meal with fries"
              className="w-full object-cover rounded-[16px] transition-transform duration-300"
              loading="lazy"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src={Menu}
              alt="Menu with various food options"
              className="w-full object-cover rounded-[16px] transition-transform duration-300"
              loading="lazy"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src={Chicken}
              alt="Grilled chicken platter with sides"
              className="w-full object-cover rounded-[16px] transition-transform duration-300"
              loading="lazy"
            />
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Movies Section */}
      <div className="px-4 sm:px-6 md:px-8 py-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
          Movies
        </h2>
        <div className="flex flex-wrap gap-8 mb-4">
          <button
            onClick={() => setActiveTab("nowShowing")}
            className={`py-2 text-lg transition-colors duration-200 ${
              activeTab === "nowShowing"
                ? "text-black"
                : "text-[#5F6C75] hover:text-black"
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`py-2 text-lg transition-colors duration-200 ${
              activeTab === "upcoming"
                ? "text-black"
                : "text-[#5F6C75] hover:text-black"
            }`}
          >
            Upcoming
          </button>
        </div>

        <div className="relative">
          <div
            ref={movieScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 transition-all duration-300 scroll-smooth"
          >
            {currentMovies.map((movie, index) => (
              <div
                key={index}
                className="flex-shrink-0 md:max-w-[295px] rounded-2xl overflow-hidden transform hover:scale-105 transition-transform duration-200"
              >
                <div className="h-[320px] sm:h-[350px] md:h-[395px] lg:h-[417px] rounded-2xl overflow-hidden">
                  <img
                    src={movie.image}
                    alt={movie.title}
                    width={295}
                    height={417}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm sm:text-lg md:text-xl lg:text-2xl">
                    {movie.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-lg font-light">
                    {movie.genre}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => scroll(movieScrollRef, "left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors z-10"
            aria-label="Scroll movies left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll(movieScrollRef, "right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors z-10"
            aria-label="Scroll movies right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Food Section */}
      <div className="px-8 py-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
          Best Selling Food & Beverages
        </h2>
        <div className="relative">
          <div
            ref={foodScrollRef}
            className="flex gap-7 overflow-x-auto pb-4 scroll-smooth"
          >
            {foodItems.map((item, index) => (
              <div
                key={index}
                className="min-w-[250px] rounded-2xl overflow-hidden border border-[#BEBEBE)] p-4"
              >
                <div className="h-[244px] mb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={202}
                    height={224}
                    onError={(e) => (e.currentTarget.src = 'path/to/placeholder/image.jpg')}
                  />
                </div>
                <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                <div className="mb-3 [&_p]:text-base [&_p]:font-normal">
                  <p>{item.weight}</p>
                  <p>{item.calories}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">{item.price}</span>
                  <button className="bg-primary px-8 py-2 text-white rounded-full text-base font-semibold hover:bg-primary/90 transition-colors duration-200">
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => scroll(foodScrollRef, "left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors z-10"
            aria-label="Scroll food items left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll(foodScrollRef, "right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors z-10"
            aria-label="Scroll food items right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </>
  );
}