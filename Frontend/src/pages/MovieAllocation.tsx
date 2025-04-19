import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Popup from "../components/Popup"; // Adjust the import path as needed

interface Movie {
  _id: string;
  title: string;
  description: string;
  duration: number;
  start_date: string;
  end_date: string;
  status: "hosting" | "expired";
  type: "upcoming" | "current";
  image: string;
}

interface Room {
  _id: string;
  name: string;
}

interface Showtime {
  _id: string;
  movie_id: any; // Using 'any' to handle potentially different formats
  date: string;
  start_time: string;
  end_time: string;
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

const AdminPanel = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [showtimes, setShowtimes] = useState<{ date: string; times: { start_time: string; end_time: string }[] }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State for existing showtimes
  const [existingShowtimes, setExistingShowtimes] = useState<Showtime[]>([]);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editEndTime, setEditEndTime] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>("");
  
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
  
  // Fetch movies
  useEffect(() => {
    axios.get("http://localhost:3001/api/movie/")
      .then((res) => {
        const activeMovies = res.data.movies.filter(
          (movie: Movie) => movie.status === "hosting"
        );
        setMovies(activeMovies);
      })
      .catch((error) => {
        console.error("Error fetching movies:", error);
        toast.error("Failed to load movies. Please refresh the page.");
      });
  }, []);

  // Fetch rooms
  useEffect(() => {
    axios.get("http://localhost:3001/api/room/") // Fetch rooms from backend
      .then((res) => {
        setRooms(res.data.rooms);
      })
      .catch((error) => console.error("Error fetching rooms:", error));
  }, []);

  // Safe getter for movie title
  const getMovieTitle = (showtime: Showtime) => {
    if (!showtime.movie_id) return "Unknown Movie";
    if (typeof showtime.movie_id === 'string') return "Movie";
    return showtime.movie_id.title || "Untitled Movie";
  };

  const addShowtime = (date: string) => {
    setShowtimes([...showtimes, { date, times: [] }]);
  };

  const addTimeSlot = (index: number) => {
    const newShowtimes = [...showtimes];
    newShowtimes[index].times.push({ start_time: "", end_time: "" });
    setShowtimes(newShowtimes);
  };

  const handleTimeChange = (dateIndex: number, timeIndex: number, field: "start_time" | "end_time", value: string) => {
    const newShowtimes = [...showtimes];
    newShowtimes[dateIndex].times[timeIndex][field] = value;
    setShowtimes(newShowtimes);
  };

  const allocateMovie = async () => {
    if (!selectedMovie || !selectedRoom || showtimes.length === 0) {
      toast.error("Please select a movie, a room, and add at least one showtime.");
      return;
    }

    // Validate dates and times
    for (const showtime of showtimes) {
      if (!showtime.date) {
        showPopup({
          title: "Validation Error",
          message: "Please select a date for all showtimes.",
          primaryButton: {
            text: "OK",
            onClick: closePopup
          }
        });
        return;
      }
      
      for (const time of showtime.times) {
        if (!time.start_time || !time.end_time) {
          showPopup({
            title: "Validation Error",
            message: "Please set both start and end times for all time slots.",
            primaryButton: {
              text: "OK",
              onClick: closePopup
            }
          });
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      const schedule = showtimes.map(showtime => ({
        date: showtime.date,
        time_slots: showtime.times
      }));
      const response = await axios.post("http://localhost:3001/api/room/allocate-movie", {
        movie_id: selectedMovie,
        room_id: selectedRoom,
        schedule
      });
      toast.success("Movie allocated successfully!");
      console.log(response.data);
      fetchShowtimes(selectedRoom);
      setShowtimes([]);
    } catch (error) {
      console.error("Error allocating movie:", error);
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.message 
        ? error.response.data.message 
        : "Failed to allocate movie.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch showtimes for a room
  const fetchShowtimes = (roomId: string) => {
    setIsLoading(true);
    axios.get(`http://localhost:3001/api/room/${roomId}/showtimes`)
      .then((res) => {
        console.log("Fetched showtimes:", res.data.showtimes);
        setExistingShowtimes(res.data.showtimes);
        setCurrentRoomId(roomId);
      })
      .catch((error) => {
        console.error("Error fetching showtimes:", error);
        showPopup({
          title: "Error",
          message: "Failed to fetch showtimes for this room.",
          primaryButton: {
            text: "OK",
            onClick: closePopup
          }
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle room selection change
  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
    if (roomId) {
      fetchShowtimes(roomId);
    } else {
      setExistingShowtimes([]);
      setCurrentRoomId("");
    }
  };

  // Setup for editing a showtime
  const setupEditShowtime = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    
    // Format date string from ISO to YYYY-MM-DD
    const dateObj = new Date(showtime.date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setEditDate(formattedDate);
    setEditStartTime(showtime.start_time);
    setEditEndTime(showtime.end_time);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingShowtime(null);
    setEditDate("");
    setEditStartTime("");
    setEditEndTime("");
    setIsEditing(false);
  };

  // Save edited showtime
  const saveEditedShowtime = async () => {
    if (!editingShowtime || !editDate || !editStartTime || !editEndTime) {
      showPopup({
        title: "Validation Error",
        message: "Please fill in all fields.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.put(`http://localhost:3001/api/room/showtime/${editingShowtime._id}`, {
        room_id: currentRoomId,
        date: editDate,
        start_time: editStartTime,
        end_time: editEndTime
      });

      showPopup({
        title: "Success",
        message: "Showtime updated successfully!",
        primaryButton: {
          text: "OK",
          onClick: () => {
            closePopup();
            // Refresh showtimes and reset edit state
            fetchShowtimes(currentRoomId);
            cancelEdit();
          }
        }
      });
      
    } catch (error) {
      console.error("Error updating showtime:", error);
      showPopup({
        title: "Error",
        message: "Failed to update showtime.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete showtime
  const deleteShowtime = async (showtimeId: string) => {
    showPopup({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this showtime?",
      primaryButton: {
        text: "Delete",
        onClick: async () => {
          try {
            setIsLoading(true);
            closePopup();
            
            const response = await axios.delete(`http://localhost:3001/api/room/showtime/${showtimeId}`, {
              data: { room_id: currentRoomId }
            });
            
            showPopup({
              title: "Success",
              message: "Showtime deleted successfully!",
              primaryButton: {
                text: "OK",
                onClick: () => {
                  closePopup();
                  // Refresh showtimes
                  fetchShowtimes(currentRoomId);
                }
              }
            });
            
          } catch (error) {
            console.error("Error deleting showtime:", error);
            showPopup({
              title: "Error",
              message: "Failed to delete showtime.",
              primaryButton: {
                text: "OK",
                onClick: closePopup
              }
            });
          } finally {
            setIsLoading(false);
          }
        }
      },
      secondaryButton: {
        text: "Cancel",
        onClick: closePopup
      }
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-primary">Allocate Movie to Room</h2>

      {/* Room Selection */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Select Room:</label>
        <select 
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          value={selectedRoom} 
          onChange={(e) => handleRoomChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a room</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>{room.name}</option>
          ))}
        </select>
      </div>

      {/* Existing Showtimes */}
      {selectedRoom && existingShowtimes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3 text-primary">Current Showtimes</h3>
          <div className="border border-gray-300 rounded-lg p-4">
            {isEditing && editingShowtime ? (
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">Edit Showtime</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Date:</label>
                    <input 
                      type="date" 
                      value={editDate} 
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-lg" 
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Start Time:</label>
                    <input 
                      type="time" 
                      value={editStartTime} 
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-lg" 
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">End Time:</label>
                    <input 
                      type="time" 
                      value={editEndTime} 
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-lg" 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
                    onClick={cancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                    onClick={saveEditedShowtime}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {existingShowtimes.map((showtime) => (
                  <div key={showtime._id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <p className="font-medium">{getMovieTitle(showtime)}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(showtime.date)} • {showtime.start_time} - {showtime.end_time}
                        </p>
                      </div>
                      <div className="flex space-x-2 mt-2 md:mt-0">
                        <button 
                          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                          onClick={() => setupEditShowtime(showtime)}
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button 
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                          onClick={() => deleteShowtime(showtime._id)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold mb-3 text-primary">Add New Showtime</h3>

      {/* Movie Selection */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Select Movie:</label>
        <select 
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          value={selectedMovie} 
          onChange={(e) => setSelectedMovie(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a movie</option>
          {movies.map((movie) => (
            <option key={movie._id} value={movie._id}>{movie.title}</option>
          ))}
        </select>
      </div>

      {/* Showtimes Section */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Showtimes:</label>
        {showtimes.map((showtime, dateIndex) => (
          <div key={dateIndex} className="mt-2 p-4 border border-gray-300 rounded-lg">
            <div className="flex items-center mb-2">
              <label className="block font-medium text-gray-700 mr-2">Date:</label>
              <input 
                type="date" 
                value={showtime.date} 
                onChange={(e) => {
                  const newShowtimes = [...showtimes];
                  newShowtimes[dateIndex].date = e.target.value;
                  setShowtimes(newShowtimes);
                }} 
                className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading} 
              />
              <button 
                className="ml-2 bg-primary text-white p-2 rounded-lg hover:bg-primary-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={() => addTimeSlot(dateIndex)}
                disabled={isLoading}
              >
                + Add Time
              </button>
            </div>

            {showtime.times.map((time, timeIndex) => (
              <div key={timeIndex} className="mt-2 flex gap-4">
                <div className="flex flex-col">
                  <label className="block font-medium text-gray-700">Start:</label>
                  <input 
                    type="time" 
                    value={time.start_time} 
                    onChange={(e) => handleTimeChange(dateIndex, timeIndex, "start_time", e.target.value)} 
                    className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block font-medium text-gray-700">End:</label>
                  <input 
                    type="time" 
                    value={time.end_time} 
                    onChange={(e) => handleTimeChange(dateIndex, timeIndex, "end_time", e.target.value)} 
                    className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
        <button 
          className="mt-3 bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => addShowtime("")}
          disabled={isLoading}
        >
          + Add Date
        </button>
      </div>

      {/* Allocate Movie Button */}
      <button 
        className="mt-3 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={allocateMovie}
        disabled={isLoading}
      >
        {isLoading ? "Allocating..." : "Allocate Movie"}
      </button>
      
      {/* Toast and Popup components */}
      <ToastContainer position="top-right" />
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

export default AdminPanel;