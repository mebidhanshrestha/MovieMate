import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../config/api";

type Movie = {
  _id: string;
  title: string;
  image: string;
  duration: string;
  type: string;
  status: string; // Added this property
};

type TabType = "current" | "upcoming" | "all";

const MovieList = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  
  // useEffect(() => {
  //   setLoading(true);
  //   axios
  //     .get("http://localhost:3001/api/movie")
  //     .then((response) => {
  //       setMovies(response.data.movies);
  //       setLoading(false);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching movies:", error);
  //       setLoading(false);
  //     });
  // }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/api/movie")
      .then((response) => {
        // Only keep movies with "hosting" status
        const activeMovies = response.data.movies.filter(
          (movie: Movie) => movie.status === "hosting"
        );
        setMovies(activeMovies);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching movies:", error);
        setLoading(false);
      });
  }, []);

  // Format the duration
  const formatDuration = (minutes: string) => {
    if (!minutes) return "";
    
    const mins = parseInt(minutes, 10);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  // Filter movies based on active tab
  const filteredMovies = movies.filter(movie => {
    if (activeTab === "all") return true;
    if (activeTab === "current") return movie.type === "current";
    if (activeTab === "upcoming") return movie.type === "upcoming";
    return true;
  });

  // Helper function to get image URL
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">Movies</h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-8 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`py-2 text-lg transition-colors duration-200 ${
            activeTab === "all"
              ? "text-black"
              : "text-[#5F6C75] hover:text-black"
          }`}
        >
          All Movies
        </button>
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
      
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No movies found for this category
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {filteredMovies.map((movie) => (
            <Link 
              to={`/showtimes/${movie._id}`} 
              key={movie._id}
              className="flex-shrink-0 md:max-w-[295px] rounded-2xl overflow-hidden transform hover:scale-105 transition-transform duration-200 bg-white"
            >
              <div className="h-[320px] sm:h-[350px] md:h-[395px] lg:h-[417px] rounded-2xl overflow-hidden">
                <img
                  src={getImageUrl(movie.image)}
                  alt={movie.title}
                  width={295}
                  height={417}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/api/placeholder/300/450";
                  }}
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
    </div>
  );
};

export default MovieList;