import { useState, useEffect } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import Popup from "../components/Popup"; // Adjust the import path as needed

interface Movie {
  _id: string;
  title: string;
  duration: string;
  start_date: string;
  end_date: string;
  status: string;
  type: string;
  image: string;
  price: number;
}

interface PopupConfig {
  isOpen: boolean;
  title: string;
  message: string;
  primaryButton: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
}

const AdminMovie = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Popup state
  const [popup, setPopup] = useState<PopupConfig>({
    isOpen: false,
    title: "",
    message: "",
    primaryButton: {
      text: "OK",
      onClick: () => closePopup()
    }
  });
  
  const initialMovieState = {
    title: "",
    duration: "",
    start_date: "",
    end_date: "",
    status: "hosting",
    type: "current",
    image: null as File | null,
    price: 0,
  };
  
  const [movie, setMovie] = useState(initialMovieState);
  
  // Helper function to show popup
  const showPopup = (config: Partial<PopupConfig>) => {
    setPopup({
      ...popup,
      isOpen: true,
      ...config
    });
  };
  
  // Helper function to close popup
  const closePopup = () => {
    setPopup({
      ...popup,
      isOpen: false
    });
  };
  
  // Fetch all movies
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/movie");
      let moviesData = response.data.movies || [];
      
      // Update status based on end date
      moviesData = moviesData.map((movie: Movie) => {
        const endDate = new Date(movie.end_date);
        const currentDate = new Date();
        
        // If end date has passed, update status to expired
        if (endDate < currentDate && movie.status === "hosting") {
          // Update the movie status in the backend
          axios.patch(`http://localhost:3001/api/movie/${movie._id}`, {
            status: "expired"
          }).catch(error => {
            console.error("Error updating movie status:", error);
          });
          
          return { ...movie, status: "expired" };
        }
        return movie;
      });

      // Sort movies by start_date descending (most recent first)
      moviesData = moviesData.sort((a: Movie, b: Movie) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setMovies(moviesData);
      setFilteredMovies(moviesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setLoading(false);
      showPopup({
        title: "Error",
        message: "Failed to fetch movies. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };
  
  useEffect(() => {
    fetchMovies();
  }, []);

  // Filter movies when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMovies(movies);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = movies.filter(movie => 
        movie.title.toLowerCase().includes(lowercasedSearch) || 
        movie.type.toLowerCase().includes(lowercasedSearch) ||
        movie.status.toLowerCase().includes(lowercasedSearch)
      );
      // Sort filtered movies by start_date descending
      setFilteredMovies(filtered.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
    }
  }, [searchTerm, movies]);

  // Fetch a single movie for editing
  const fetchMovieById = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/movie/${id}`);
      const movieData = response.data.movie;
      
      // Format dates to YYYY-MM-DD for input fields
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setMovie({
        title: movieData.title,
        duration: movieData.duration,
        start_date: formatDate(movieData.start_date),
        end_date: formatDate(movieData.end_date),
        status: movieData.status,
        type: movieData.type,
        image: null, // The existing image will be kept if no new one is selected
        price: movieData.price || 0, // Get price, default to 0 if not available
      });
      
      setIsEditing(true);
      setSelectedMovieId(id);
      
      // Scroll to the edit form
      setTimeout(() => {
        document.getElementById('movieEditForm')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      showPopup({
        title: "Error",
        message: "Failed to fetch movie details. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMovie((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMovie((prev) => ({ ...prev, image: e.target.files && e.target.files[0] }));
    }
  };

  const resetForm = () => {
    setMovie(initialMovieState);
    setIsEditing(false);
    setSelectedMovieId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Append form fields to formData
    formData.append("title", movie.title);
    formData.append("duration", movie.duration);
    formData.append("start_date", movie.start_date);
    formData.append("end_date", movie.end_date);
    formData.append("status", movie.status);
    formData.append("type", movie.type);
    formData.append("price", movie.price.toString());
    
    // Only append image if a new one is selected
    if (movie.image) {
      formData.append("image", movie.image);
    }

    try {
      if (isEditing && selectedMovieId) {
        // Update existing movie
        await axios.put(`http://localhost:3001/api/movie/${selectedMovieId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showPopup({
          title: "Success",
          message: "Movie updated successfully!",
          primaryButton: {
            text: "OK",
            onClick: () => {
              closePopup();
              resetForm();
              fetchMovies();
            }
          }
        });
      } else {
        // Add new movie
        await axios.post("http://localhost:3001/api/movie/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showPopup({
          title: "Success",
          message: "Movie added successfully!",
          primaryButton: {
            text: "OK",
            onClick: () => {
              closePopup();
              resetForm();
              fetchMovies();
            }
          }
        });
      }
    } catch (error) {
      console.error("Error saving movie:", error);
      showPopup({
        title: "Error",
        message: "Error saving movie. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };

  const handleDelete = async (id: string) => {
    showPopup({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this movie?",
      primaryButton: {
        text: "Delete",
        onClick: async () => {
          try {
            await axios.delete(`http://localhost:3001/api/movie/${id}`);
            closePopup();
            showPopup({
              title: "Success",
              message: "Movie deleted successfully!",
              primaryButton: {
                text: "OK",
                onClick: () => {
                  closePopup();
                  fetchMovies();
                }
              }
            });
          } catch (error) {
            console.error("Error deleting movie:", error);
            closePopup();
            showPopup({
              title: "Error",
              message: "Error deleting movie. Please try again.",
              primaryButton: {
                text: "OK",
                onClick: closePopup
              }
            });
          }
        }
      },
      secondaryButton: {
        text: "Cancel",
        onClick: closePopup
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-primary">
        {isEditing ? "Edit Movie" : "Add Movie"}
      </h2>
      
      {/* Movie Form */}
      <form id="movieEditForm" onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Title:</label>
            <input
              type="text"
              name="title"
              value={movie.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Duration (minutes):</label>
            <input
              type="number"
              name="duration"
              value={movie.duration}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Start Date:</label>
            <input
              type="date"
              name="start_date"
              value={movie.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">End Date:</label>
            <input
              type="date"
              name="end_date"
              value={movie.end_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="block font-medium text-gray-700">Status:</label>
            <select
              name="status"
              value={movie.status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hosting">Hosting</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="w-1/3">
            <label className="block font-medium text-gray-700">Type:</label>
            <select
              name="type"
              value={movie.type}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="current">Current</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
          <div className="w-1/3">
            <label className="block font-medium text-gray-700">Price (Rs.):</label>
            <input
              type="number"
              name="price"
              value={movie.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700">
            Movie Image {isEditing && "(Leave empty to keep current image)"}:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            {...(!isEditing ? { required: true } : {})}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-colors duration-200"
          >
            {isEditing ? "Update Movie" : "Add Movie"}
          </button>
          
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Movie List with Search */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Movie List</h2>
          
          {/* Search Box */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        {loading ? (
          <p className="text-center py-4">Loading...</p>
        ) : filteredMovies.length === 0 ? (
          <p className="text-center py-4">
            {searchTerm ? "No movies found matching your search" : "No movies found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b">Image</th>
                  <th className="py-3 px-4 border-b">Title</th>
                  <th className="py-3 px-4 border-b">Duration</th>
                  <th className="py-3 px-4 border-b">Price</th>
                  <th className="py-3 px-4 border-b">Start Date</th>
                  <th className="py-3 px-4 border-b">End Date</th>
                  <th className="py-3 px-4 border-b">Status</th>
                  <th className="py-3 px-4 border-b">Type</th>
                  <th className="py-3 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movieItem) => (
                  <tr key={movieItem._id}>
                    <td className="py-3 px-4 border-b">
                      <img 
                        src={`http://localhost:3001${movieItem.image}`} 
                        alt={movieItem.title} 
                        className="w-16 h-20 object-cover"
                      />
                    </td>
                    <td className="py-3 px-4 border-b">{movieItem.title}</td>
                    <td className="py-3 px-4 border-b">{movieItem.duration} min</td>
                    <td className="py-3 px-4 border-b">Rs. {movieItem.price?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4 border-b">{formatDate(movieItem.start_date)}</td>
                    <td className="py-3 px-4 border-b">{formatDate(movieItem.end_date)}</td>
                    <td className="py-3 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        movieItem.status === 'hosting' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {movieItem.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        movieItem.type === 'current' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {movieItem.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchMovieById(movieItem._id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movieItem._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Popup Component */}
      <Popup 
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        primaryButton={popup.primaryButton}
        secondaryButton={popup.secondaryButton}
      />
    </div>
  );
};

export default AdminMovie;