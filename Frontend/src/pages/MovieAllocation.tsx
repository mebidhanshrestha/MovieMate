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
  const [showtimes, setShowtimes] = useState<{ date: string; times: { start: string; end: string }[] }[]>([]);

  useEffect(() => {
    axios.get("http://localhost:3001/api/movie/")
      .then((res) => {
        console.log(res.data); // Log the response to inspect its structure
        setMovies(res.data.movies);
      })
      .catch((error) => console.error("Error fetching movies:", error));
  }, []);
  

  const addShowtime = (date: string) => {
    setShowtimes([...showtimes, { date, times: [] }]);
  };

  const addTimeSlot = (index: number) => {
    const newShowtimes = [...showtimes];
    newShowtimes[index].times.push({ start: "", end: "" });
    setShowtimes(newShowtimes);
  };

  const handleTimeChange = (dateIndex: number, timeIndex: number, field: "start" | "end", value: string) => {
    const newShowtimes = [...showtimes];
    newShowtimes[dateIndex].times[timeIndex][field] = value;
    setShowtimes(newShowtimes);
  };

  const allocateMovie = async () => {
    try {
      await axios.post("http://localhost:3001/api/room/allocate-movie", { // Fixed API path
        movie_id: selectedMovie,
        room_id: selectedRoom,
        showtimes,
      });
      alert("Movie allocated successfully!");
    } catch (error) {
      console.error("Error allocating movie:", error);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold">Allocate Movie to Room</h2>

      <label className="block mt-3">Select Movie:</label>
      <select className="border p-2" value={selectedMovie} onChange={(e) => setSelectedMovie(e.target.value)}>
        <option value="">Select a movie</option>
        {movies.map((movie) => (
          <option key={movie._id} value={movie._id}>{movie.title}</option>
        ))}
      </select>

      <label className="block mt-3">Select Room:</label>
      {/* <select className="border p-2" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
        <option value="">Select a room</option>
        {rooms.map((room) => (
          <option key={room._id} value={room._id}>{room.name}</option>
        ))}
      </select> */}

      <label className="block mt-3">Showtimes:</label>
      {showtimes.map((showtime, dateIndex) => (
        <div key={dateIndex} className="mt-2 p-2 border">
          <label>Date:</label>
          <input type="date" value={showtime.date} onChange={(e) => {
            const newShowtimes = [...showtimes];
            newShowtimes[dateIndex].date = e.target.value;
            setShowtimes(newShowtimes);
          }} className="border p-1" />
          <button className="ml-2 bg-blue-500 text-white p-1" onClick={() => addTimeSlot(dateIndex)}>+ Add Time</button>

          {showtime.times.map((time, timeIndex) => (
            <div key={timeIndex} className="mt-1 flex gap-2">
              <label>Start:</label>
              <input type="time" value={time.start} onChange={(e) => handleTimeChange(dateIndex, timeIndex, "start", e.target.value)} className="border p-1" />
              <label>End:</label>
              <input type="time" value={time.end} onChange={(e) => handleTimeChange(dateIndex, timeIndex, "end", e.target.value)} className="border p-1" />
            </div>
          ))}
        </div>
      ))}
      <button className="mt-3 bg-green-500 text-white p-2" onClick={() => addShowtime("")}>+ Add Date</button>
      <button className="mt-3 bg-blue-500 text-white p-2" onClick={allocateMovie}>Allocate Movie</button>
    </div>
  );
};

export default AdminPanel;