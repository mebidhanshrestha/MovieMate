import { useState, useEffect } from "react";
import axios from "axios";

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

const AdminPanel = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [showtimes, setShowtimes] = useState<{ date: string; times: { start_time: string; end_time: string }[] }[]>([]);

  // Fetch movies
  useEffect(() => {
    axios.get("http://localhost:3001/api/movie/")
      .then((res) => {
        setMovies(res.data.movies);
      })
      .catch((error) => console.error("Error fetching movies:", error));
  }, []);

  // Fetch rooms
  useEffect(() => {
    axios.get("http://localhost:3001/api/room/") // Fetch rooms from backend
      .then((res) => {
        setRooms(res.data.rooms);
      })
      .catch((error) => console.error("Error fetching rooms:", error));
  }, []);

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
      alert("Please select a movie, a room, and add at least one showtime.");
      return;
    }

    try {
      const schedule = showtimes.map(showtime => ({
        date: showtime.date,
        time_slots: showtime.times
      }));

      const response = await axios.post("http://localhost:3001/api/room/allocate-movie", {
        movie_id: selectedMovie,
        room_id: selectedRoom,
        schedule
      });

      alert("Movie allocated successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error allocating movie:", error);
      alert("Failed to allocate movie.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-primary">Allocate Movie to Room</h2>

      {/* Movie Selection */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Select Movie:</label>
        <select className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={selectedMovie} onChange={(e) => setSelectedMovie(e.target.value)}>
          <option value="">Select a movie</option>
          {movies.map((movie) => (
            <option key={movie._id} value={movie._id}>{movie.title}</option>
          ))}
        </select>
      </div>

      {/* Room Selection */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Select Room:</label>
        <select className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          <option value="">Select a room</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>{room.name}</option>
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
              <input type="date" value={showtime.date} onChange={(e) => {
                const newShowtimes = [...showtimes];
                newShowtimes[dateIndex].date = e.target.value;
                setShowtimes(newShowtimes);
              }} className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              <button className="ml-2 bg-primary text-white p-2 rounded-lg hover:bg-primary-100 transition-colors duration-200" onClick={() => addTimeSlot(dateIndex)}>+ Add Time</button>
            </div>

            {showtime.times.map((time, timeIndex) => (
              <div key={timeIndex} className="mt-2 flex gap-4">
                <div className="flex flex-col">
                  <label className="block font-medium text-gray-700">Start:</label>
                  <input type="time" value={time.start_time} onChange={(e) => handleTimeChange(dateIndex, timeIndex, "start_time", e.target.value)} className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex flex-col">
                  <label className="block font-medium text-gray-700">End:</label>
                  <input type="time" value={time.end_time} onChange={(e) => handleTimeChange(dateIndex, timeIndex, "end_time", e.target.value)} className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            ))}
          </div>
        ))}
        <button className="mt-3 bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-colors duration-200" onClick={() => addShowtime("")}>+ Add Date</button>
      </div>

      {/* Allocate Movie Button */}
      <button className="mt-3 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors duration-200" onClick={allocateMovie}>Allocate Movie</button>
    </div>
  );
};

export default AdminPanel;