import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import axios from "axios";
import Burger from "../assets/images/burger-banner.png";
import Menu from "../assets/images/menu-banner.png";
import Chicken from "../assets/images/chicken-banner.png";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination } from "swiper/modules";

// Define TypeScript interfaces
interface Movie {
  _id: string;
  title: string;
  description: string;
  duration: string;
  start_date: string;
  end_date: string;
  status: string;
  type: string;
  image: string;
}

interface FoodItem {
  name: string;
  weight: string;
  calories: string;
  price: string;
  image: string;
}

type TabType = "current" | "upcoming";

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const movieScrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch movies from the API
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3001/api/movie");
        const allMovies = response.data.movies || [];
        
        setMovies(allMovies);
        
        // Filter current and upcoming movies
        const current = allMovies.filter((movie: Movie) => movie.type === "current");
        const upcoming = allMovies.filter((movie: Movie) => movie.type === "upcoming");
        
        setCurrentMovies(current);
        setUpcomingMovies(upcoming);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies");
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const scroll = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right"
  ): void => {
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

  // Get current active movies based on tab
  const activeMovies = activeTab === "current" ? currentMovies : upcomingMovies;

  // Format the duration
  const formatDuration = (minutes: string) => {
    const mins = parseInt(minutes, 10);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <div className="container mx-auto">
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
              onClick={() => setActiveTab("current")}
              className={`py-2 text-lg transition-colors duration-200 ${
                activeTab === "current"
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
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : activeMovies.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No {activeTab} movies available
              </div>
            ) : (
              <div
                ref={movieScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 transition-all duration-300 scroll-smooth"
              >
                {activeMovies.map((movie) => (
                  <Link 
                    to={`/movies`} 
                    key={movie._id}
                    className="flex-shrink-0 md:max-w-[295px] rounded-2xl overflow-hidden transform hover:scale-105 transition-transform duration-200"
                  >
                    <div className="h-[320px] sm:h-[350px] md:h-[395px] lg:h-[417px] rounded-2xl overflow-hidden">
                      <img
                        src={`http://localhost:3001${movie.image}`}
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
                        {formatDuration(movie.duration)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {activeMovies.length > 0 && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}