import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import api from "../config/api";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination } from "swiper/modules";

// Fallback images in case API fails
import Burger from "../assets/images/burger-banner.png";
import Menu from "../assets/images/menu-banner.png";
import Chicken from "../assets/images/chicken-banner.png";

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

interface Banner {
  _id: string;
  title: string;
  altText: string;
  image: string;
  active: boolean;
  order: number;
}

type TabType = "current" | "upcoming";

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bannersLoading, setBannersLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bannersError, setBannersError] = useState<string | null>(null);
  
  const movieScrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setBannersLoading(true);
        console.log("Fetching banners from API...");
        const response = await api.get("/api/banner/active");
        console.log("Banner response:", response.data);
        const activeBanners = response.data || [];
        
        setBanners(activeBanners);
        setBannersLoading(false);
      } catch (err) {
        console.error("Error fetching banners:", err);
        setBannersError("Failed to load banners");
        setBannersLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/movie");
        const allMovies = response.data.movies || [];
        
        // Filter out movies with "expired" status - only keep "hosting" status
        const activeMovies = allMovies.filter((movie: Movie) => movie.status === "hosting");
        
        setMovies(activeMovies);
        
        // Filter current and upcoming movies (only from active/hosting movies)
        const current = activeMovies.filter((movie: Movie) => movie.type === "current");
        const upcoming = activeMovies.filter((movie: Movie) => movie.type === "upcoming");
        
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

  // Generate fallback banners if API fails or no banners are available
  const getFallbackBanners = () => [
    { _id: "fallback1", title: "Burger Special", altText: "Delicious burger meal with fries", image: Burger, active: true, order: 0 },
    { _id: "fallback2", title: "Menu Options", altText: "Menu with various food options", image: Menu, active: true, order: 1 },
    { _id: "fallback3", title: "Chicken Platter", altText: "Grilled chicken platter with sides", image: Chicken, active: true, order: 2 }
  ];

  // Determine which banners to display
  const displayBanners = banners.length > 0 ? banners : getFallbackBanners();

  // Debug: Log banner paths
  useEffect(() => {
    if (banners.length > 0) {
      console.log("Banner image paths:", banners.map(b => b.image));
    }
  }, [banners]);

  // Helper function to get image URL
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL}${path}`;
  };

  // Helper function to get uploads URL
  const getUploadsUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL}/uploads${path}`;
  };

  // Helper function to get safe uploads URL
  const getSafeUploadsUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL}/uploads${path.startsWith('/') ? path : `/${path}`}`;
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
            {bannersLoading ? (
              <SwiperSlide>
                <div className="w-full h-[300px] flex justify-center items-center bg-gray-200 rounded-[16px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </SwiperSlide>
            ) : bannersError ? (
              <SwiperSlide>
                <div className="w-full h-[300px] flex justify-center items-center bg-gray-200 rounded-[16px]">
                  <p className="text-red-500">{bannersError}</p>
                </div>
              </SwiperSlide>
            ) : (
              displayBanners.map((banner) => (
                <SwiperSlide key={banner._id}>
                  <img
                    src={getSafeUploadsUrl(banner.image)}
                    alt={banner.altText}
                    className="w-full h-[300px] object-cover rounded-[16px] transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image failed to load:', getSafeUploadsUrl(banner.image));
                      // Fallback to a placeholder if the image fails to load
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found';
                    }}
                  />
                </SwiperSlide>
              ))
            )}
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
                        src={getImageUrl(movie.image)}
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