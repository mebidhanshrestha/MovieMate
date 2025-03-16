import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

type Showtime = {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type Room = {
  name: string;
  showtimes: Showtime[];
  id: string;
};

const ShowtimeSelection = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/movie/${movieId}/showtimes`)
      .then((response) => setRooms(response.data.rooms.map((room: any) => ({
        ...room,
        id: room._id, // Assign `_id` to `id` if needed
      }))))
      .catch((error) => console.error("Error fetching showtimes:", error));
  }, [movieId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Showtime</h2>
      {rooms.map((room) => (
  <div key={room.id} className="mb-6"> 
    <h3 className="text-xl font-semibold">{room.name}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
      {room.showtimes.map((showtime) => (
        <Link
          key={showtime._id}
          to={`/seats/${showtime._id}/${movieId}/${room.id}?date=${encodeURIComponent(showtime.date)}`}
          className="border p-4 rounded-lg shadow-md hover:bg-gray-100 transition"
        >
          <p>{new Date(showtime.date).toLocaleDateString()}</p>
          <p>{showtime.start_time} - {showtime.end_time}</p>
        </Link>
      ))}
    </div>
  </div>
))}

    </div>
  );
};

export default ShowtimeSelection;